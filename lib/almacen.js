// Almacenamiento de encuestas en un archivo JSON.
// Las escrituras se encadenan y se hacen sobre un archivo temporal que luego
// se renombra, para que una caída a mitad de escritura no corrompa los datos.

import { promises as fs } from 'node:fs';
import path from 'node:path';

export class Almacen {
  constructor(archivo) {
    this.archivo = archivo;
    this.registros = [];
    this.cola = Promise.resolve();
  }

  async iniciar() {
    await fs.mkdir(path.dirname(this.archivo), { recursive: true });
    try {
      this.registros = JSON.parse(await fs.readFile(this.archivo, 'utf8'));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      this.registros = [];
    }
  }

  guardar() {
    const datos = JSON.stringify(this.registros, null, 2);
    this.cola = this.cola.then(async () => {
      const tmp = `${this.archivo}.tmp`;
      await fs.writeFile(tmp, datos);
      await fs.rename(tmp, this.archivo);
    });
    return this.cola;
  }

  listar() {
    return this.registros;
  }

  obtener(id) {
    return this.registros.find((r) => r.id === id) || null;
  }

  async crear(registro) {
    this.registros.push(registro);
    await this.guardar();
    return registro;
  }

  async actualizar(id, cambios) {
    const r = this.obtener(id);
    if (!r) return null;
    Object.assign(r, cambios);
    await this.guardar();
    return r;
  }

  async eliminar(id) {
    const antes = this.registros.length;
    this.registros = this.registros.filter((r) => r.id !== id);
    if (this.registros.length === antes) return false;
    await this.guardar();
    return true;
  }
}
