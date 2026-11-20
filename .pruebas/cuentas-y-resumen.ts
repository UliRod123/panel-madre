/**
 * Cuentas con PIN y lectura de los tres resúmenes, contra Postgres LOCAL.
 * Ejecutar desde la raíz: npx tsx --conditions=react-server .pruebas/cuentas-y-resumen.ts
 *
 * Usa cuentas propias con un prefijo y las borra al terminar. Los tres paneles
 * se imitan con un servidor local: no se llama a ningún panel de verdad.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { alternarCuenta, cambiarPin, comprobarAcceso, crearCuenta, INTENTOS_PERMITIDOS } from "@/lib/cuentas";
import { ErrorDeCaptura } from "@/lib/formulario";
import { leerLosTres, pendientes } from "@/lib/paneles";

const prefijo = `prueba${randomUUID().slice(0, 6)}`;
const CLAVE = "clave-de-prueba-larga-123456";
let casos = 0;

async function caso(nombre: string, comprobar: () => void | Promise<void>) {
  await comprobar();
  casos += 1;
  console.log(`✓ ${nombre}`);
}

async function falla(promesa: Promise<unknown>, texto: RegExp) {
  await assert.rejects(promesa, (error) => error instanceof ErrorDeCaptura && texto.test(error.message));
}

/* ── Un servidor que hace de los tres paneles ───────────────────────────── */

const produccion = {
  panel: "produccion", dia: "2026-11-20", generadoEn: new Date().toISOString(), enCurso: null,
  pedidos: { enCola: 0, suspendidos: 1, enEspera: 0, retomar: 2, terminadosHoy: 3, piezasTerminadasHoy: 900 },
  equipo: { total: 4, trabajando: 2, enPausa: 0, suspendidas: 0, piezasHoy: 1200, rendimientoPromedio: 96 },
  personas: [],
};
const pedidos = {
  panel: "pedidos", dia: "2026-11-20", generadoEn: new Date().toISOString(), activos: 9,
  porEtapa: { nuevo: 4, sinstock: 5 }, entraronHoy: 3, enviadosHoy: 2, canceladosHoy: 0,
  atrasados: 1, vencenHoy: 0, solicitudesAbiertas: 0, masAtrasados: [],
};

function servidor() {
  return new Promise<{ url: string; cerrar: () => void }>((listo) => {
    const s = http.createServer((req, res) => {
      const conClave = req.headers.authorization === `Bearer ${CLAVE}`;
      if (req.url === "/lento") return void setTimeout(() => res.end("{}"), 15_000);
      if (!conClave) { res.writeHead(401); return void res.end("{}"); }
      res.setHeader("content-type", "application/json");
      if (req.url === "/produccion/api/resumen") return void res.end(JSON.stringify(produccion));
      if (req.url === "/rastreo/api/resumen") return void res.end(JSON.stringify(produccion)); // se equivoca de resumen
      if (req.url === "/pedidos") return void res.end(JSON.stringify(pedidos));
      res.writeHead(404); res.end("{}");
    });
    s.listen(0, () => listo({ url: `http://127.0.0.1:${(s.address() as AddressInfo).port}`, cerrar: () => { s.closeAllConnections(); s.close(); } }));
  });
}

async function principal() {
  const ahora = new Date();
  const dueno = await crearCuenta({ nombre: "Dueño Prueba", usuario: `${prefijo}dueno`, pin: "4826", esDueno: true });
  const jefa = await crearCuenta({ nombre: "Jefa Prueba", usuario: `${prefijo}jefa`, pin: "1357", esDueno: false });

  try {
    await caso("entra con usuario y PIN, sin importar mayúsculas", async () => {
      const sesion = await comprobarAcceso(`  ${prefijo.toUpperCase()}JEFA `, "1357");
      assert.equal(sesion.id, jefa.id);
    });
    await caso("mismo mensaje para usuario inexistente y PIN malo", async () => {
      await falla(comprobarAcceso(`${prefijo}nadie`, "1357"), /Usuario o PIN incorrecto/);
      await falla(comprobarAcceso(`${prefijo}jefa`, "9999"), /Usuario o PIN incorrecto/);
    });
    await caso(`frena después de ${INTENTOS_PERMITIDOS} PIN malos, aunque luego ponga el bueno`, async () => {
      for (let i = 1; i < INTENTOS_PERMITIDOS - 1; i++) await falla(comprobarAcceso(`${prefijo}jefa`, "9999", ahora), /incorrecto/);
      await falla(comprobarAcceso(`${prefijo}jefa`, "9999", ahora), /Demasiados intentos/);
      await falla(comprobarAcceso(`${prefijo}jefa`, "1357", ahora), /Demasiados intentos/);
      // Pasados los minutos del freno, entra.
      const despues = new Date(ahora.getTime() + 6 * 60_000);
      assert.equal((await comprobarAcceso(`${prefijo}jefa`, "1357", despues)).id, jefa.id);
    });
    await caso("cambiar el PIN quita el freno", async () => {
      for (let i = 0; i < INTENTOS_PERMITIDOS; i++) await comprobarAcceso(`${prefijo}jefa`, "0000").catch(() => {});
      await falla(comprobarAcceso(`${prefijo}jefa`, "1357"), /Demasiados intentos/);
      await cambiarPin(jefa.id, "2468");
      assert.equal((await comprobarAcceso(`${prefijo}jefa`, "2468")).id, jefa.id);
    });
    await caso("PIN de 4 a 8 números y usuario sin repetir", async () => {
      await falla(cambiarPin(jefa.id, "12"), /4 a 8/);
      await falla(cambiarPin(jefa.id, "abcd"), /4 a 8/);
      await falla(crearCuenta({ nombre: "Otra", usuario: `${prefijo}jefa`, pin: "1234", esDueno: false }), /ocupado/);
    });
    await caso("nadie se desactiva a sí mismo; una cuenta desactivada no entra", async () => {
      await falla(alternarCuenta(dueno.id, dueno.id), /propia cuenta/);
      assert.equal(await alternarCuenta(jefa.id, dueno.id), false);
      await falla(comprobarAcceso(`${prefijo}jefa`, "2468"), /Usuario o PIN incorrecto/);
      assert.equal(await alternarCuenta(jefa.id, dueno.id), true);
    });
    await caso("no se queda el panel sin dueño activo", async () => {
      const otrosDuenos = await prisma.cuenta.findMany({ where: { esDueno: true, activa: true, id: { not: dueno.id } } });
      if (otrosDuenos.length === 0) await falla(alternarCuenta(dueno.id, jefa.id), /al menos un dueño/);
    });

    const { url, cerrar } = await servidor();
    try {
      await caso("lee los tres por su lado: uno bien, uno equivocado, uno sin clave", async () => {
        process.env.PRODUCCION_URL = `${url}/produccion`;
        process.env.RASTREO_URL = `${url}/rastreo`;
        process.env.PEDIDOS_URL = "https://pedidos.ejemplo";
        process.env.PEDIDOS_RESUMEN_URL = `${url}/pedidos`;
        process.env.RESUMEN_SECRETO_PRODUCCION = CLAVE;
        process.env.RESUMEN_SECRETO_RASTREO = CLAVE;
        process.env.RESUMEN_SECRETO_PEDIDOS = "";
        const lecturas = await leerLosTres();
        assert.equal(lecturas.produccion.estado, "ok");
        assert.equal(lecturas.rastreo.estado, "error", "si contesta otra cosa no se toma como suyo");
        assert.deepEqual(lecturas.pedidos, { estado: "sin-configurar", falta: "RESUMEN_SECRETO_PEDIDOS" });
        assert.equal(lecturas.fuentes.produccion.abrir, `${url}/produccion/panel`);
      });
      await caso("clave equivocada: lo dice con el nombre de la variable", async () => {
        process.env.RESUMEN_SECRETO_PEDIDOS = "otra-clave-que-no-coincide";
        const { pedidos: lectura } = await leerLosTres();
        assert.equal(lectura.estado, "error");
        assert.match(lectura.estado === "error" ? lectura.mensaje : "", /RESUMEN_SECRETO_PEDIDOS/);
      });
      await caso("lo que hay que ver junta los pendientes, lo grave primero", async () => {
        process.env.RESUMEN_SECRETO_PEDIDOS = CLAVE;
        const lecturas = await leerLosTres();
        assert.equal(lecturas.pedidos.estado, "ok");
        const lista = pendientes(lecturas);
        assert.deepEqual(lista.map((p) => p.texto), [
          "1 pedido atrasado",
          "2 pedidos de días anteriores por retomar",
          "1 pedido suspendido",
        ]);
        assert.ok(lista.findIndex((p) => p.tono === "aviso") > lista.findLastIndex((p) => p.tono === "mal"));
      });
      await caso("un panel que no contesta no detiene a los demás", async () => {
        process.env.PEDIDOS_RESUMEN_URL = `${url}/lento`;
        const inicio = Date.now();
        const lecturas = await leerLosTres();
        assert.equal(lecturas.produccion.estado, "ok");
        assert.equal(lecturas.pedidos.estado, "error");
        assert.match(lecturas.pedidos.estado === "error" ? lecturas.pedidos.mensaje : "", /no contestó a tiempo/);
        assert.ok(Date.now() - inicio < 12_000);
      });
    } finally {
      cerrar();
    }
  } finally {
    await prisma.cuenta.deleteMany({ where: { usuario: { startsWith: prefijo } } });
    await prisma.$disconnect();
  }
  console.log(`\n${casos} casos bien.`);
}

principal().catch((error) => {
  console.error(error);
  process.exit(1);
});
