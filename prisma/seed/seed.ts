// ═══════════════════════════════════════════════════════════════════
// Seed — Popula o banco com dados iniciais
// ═══════════════════════════════════════════════════════════════════
//
// Roda com: npx prisma db seed
//
// Cria (idempotente — não duplica se já existir):
//   - 8 usuários (ADMIN, OPERATOR, 6 PASSENGERS)
//   - 4 companhias aéreas
//   - 6 portões
//   - 8 aeronaves
//   - 11 voos (com status variados)
//   - ~35 reservas
//   - Alguns embarques
//
// ⚠️ Idempotente: rodar várias vezes não duplica nem quebra.

import {
  PrismaClient,
  Role,
  StatusVoo,
  StatusReserva,
} from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // ═══════════════════════════════════════════════════════════════
  // HELPERS (idempotentes por campo único)
  // ═══════════════════════════════════════════════════════════════

  async function criarUsuario(nome: string, email: string, senha: string, role: Role) {
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return existe;
    const senhaHash = await bcrypt.hash(senha, 10);
    const u = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, role, ativo: true },
    });
    console.log(`✅ ${role}: ${email}`);
    return u;
  }

  async function criarCompanhia(nome: string, codigoIATA: string) {
    const existe = await prisma.companhiaAerea.findUnique({ where: { codigoIATA } });
    if (existe) return existe;
    const c = await prisma.companhiaAerea.create({ data: { nome, codigoIATA } });
    console.log(`✅ Companhia: ${nome} (${codigoIATA})`);
    return c;
  }

  async function criarPortao(codigo: string, terminal: string) {
    const existe = await prisma.portao.findUnique({ where: { codigo } });
    if (existe) return existe;
    const p = await prisma.portao.create({ data: { codigo, terminal } });
    console.log(`✅ Portão: ${codigo} (${terminal})`);
    return p;
  }

  async function criarAeronave(modelo: string, matricula: string, capacidade: number, companhiaId: number) {
    const existe = await prisma.aeronave.findUnique({ where: { matricula } });
    if (existe) return existe;
    const a = await prisma.aeronave.create({
      data: { modelo, matricula, capacidade, companhiaId },
    });
    console.log(`✅ Aeronave: ${matricula} (${modelo})`);
    return a;
  }

  async function criarVoo(dados: {
    numero: string;
    origem: string;
    destino: string;
    dataPartida: string;
    dataChegada: string;
    status: StatusVoo;
    aeronaveId: number;
    portaoId: number;
  }) {
    const existe = await prisma.voo.findUnique({ where: { numero: dados.numero } });
    if (existe) return existe;
    const v = await prisma.voo.create({
      data: {
        ...dados,
        dataPartida: new Date(dados.dataPartida),
        dataChegada: new Date(dados.dataChegada),
      },
    });
    console.log(`✅ Voo: ${dados.numero} (${dados.status})`);
    return v;
  }

  async function criarReserva(usuarioId: number, vooId: number, assento: string, status: StatusReserva = StatusReserva.CONFIRMADA) {
    // @@unique([usuarioId, vooId]) → pula se já existe qualquer reserva desse user nesse voo
    const existe = await prisma.reserva.findFirst({ where: { usuarioId, vooId } });
    if (existe) return existe;
    return prisma.reserva.create({ data: { usuarioId, vooId, assento, status } });
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. USUÁRIOS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n👤 Criando usuários...');
  await criarUsuario('Admin do Aeroporto', 'admin@aeroporto.com', 'Admin@123', Role.ADMIN);
  await criarUsuario('Operador do Aeroporto', 'operador@aeroporto.com', 'Operador@123', Role.OPERATOR);
  const u3 = await criarUsuario('Passageiro Teste', 'passageiro@aeroporto.com', 'Passageiro@123', Role.PASSENGER);
  const u4 = await criarUsuario('Passageiro Dois', 'passageiro2@aeroporto.com', 'Passageiro2@123', Role.PASSENGER);
  const u5 = await criarUsuario('Maria Silva', 'maria@aeroporto.com', 'Maria@123', Role.PASSENGER);
  const u6 = await criarUsuario('João Santos', 'joao@aeroporto.com', 'Joao@123', Role.PASSENGER);
  const u7 = await criarUsuario('Ana Costa', 'ana@aeroporto.com', 'Ana@123', Role.PASSENGER);
  const u8 = await criarUsuario('Carlos Oliveira', 'carlos@aeroporto.com', 'Carlos@123', Role.PASSENGER);

  // ═══════════════════════════════════════════════════════════════
  // 2. COMPANHIAS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n✈️  Criando companhias...');
  const latam = await criarCompanhia('LATAM Airlines', 'LA');
  const azul = await criarCompanhia('Azul Linhas Aéreas', 'AD');
  const gol = await criarCompanhia('GOL Linhas Aéreas', 'G3');
  const american = await criarCompanhia('American Airlines', 'AA');

  // ═══════════════════════════════════════════════════════════════
  // 3. PORTÕES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🚪 Criando portões...');
  const a1 = await criarPortao('A1', 'Terminal 1');
  const a2 = await criarPortao('A2', 'Terminal 1');
  const a3 = await criarPortao('A3', 'Terminal 1');
  const b1 = await criarPortao('B1', 'Terminal 2');
  const b2 = await criarPortao('B2', 'Terminal 2');
  const b3 = await criarPortao('B3', 'Terminal 2');

  // ═══════════════════════════════════════════════════════════════
  // 4. AERONAVES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🛩️  Criando aeronaves...');
  const aLATAM1 = await criarAeronave('Boeing 737-800', 'PR-GTA', 180, latam.id);
  const aLATAM2 = await criarAeronave('Airbus A320', 'PR-MYA', 174, latam.id);
  const aAZUL1 = await criarAeronave('Embraer E195', 'PR-AYA', 118, azul.id);
  const aAZUL2 = await criarAeronave('Airbus A320neo', 'PR-AZA', 174, azul.id);
  const aGOL1 = await criarAeronave('Boeing 737 MAX 8', 'PR-XMA', 186, gol.id);
  const aGOL2 = await criarAeronave('Boeing 737-800', 'PR-GOL', 186, gol.id);
  const aAA1 = await criarAeronave('Boeing 777-200', 'N770AN', 273, american.id);
  const aAA2 = await criarAeronave('Boeing 787-8', 'N800AN', 242, american.id);

  // ═══════════════════════════════════════════════════════════════
  // 5. VOOS (novos, sem conflitar com os 3 já existentes)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🛫 Criando voos...');
  const vLA2001 = await criarVoo({ numero: 'LA2001', origem: 'GRU', destino: 'SSA', dataPartida: '2026-11-10T08:00:00.000Z', dataChegada: '2026-11-10T10:00:00.000Z', status: StatusVoo.PROGRAMADO, aeronaveId: aLATAM2.id, portaoId: a1.id });
  const vLA2002 = await criarVoo({ numero: 'LA2002', origem: 'GIG', destino: 'POA', dataPartida: '2026-11-10T14:00:00.000Z', dataChegada: '2026-11-10T16:30:00.000Z', status: StatusVoo.PROGRAMADO, aeronaveId: aLATAM1.id, portaoId: a1.id });
  const vAD3001 = await criarVoo({ numero: 'AD3001', origem: 'VCP', destino: 'REC', dataPartida: '2026-11-10T08:00:00.000Z', dataChegada: '2026-11-10T10:30:00.000Z', status: StatusVoo.PROGRAMADO, aeronaveId: aAZUL1.id, portaoId: b1.id });
  const vAD3002 = await criarVoo({ numero: 'AD3002', origem: 'VCP', destino: 'FOR', dataPartida: '2026-11-11T08:00:00.000Z', dataChegada: '2026-11-11T10:30:00.000Z', status: StatusVoo.PROGRAMADO, aeronaveId: aAZUL2.id, portaoId: b1.id });
  const vG3201 = await criarVoo({ numero: 'G3201', origem: 'CGH', destino: 'BSB', dataPartida: '2026-11-10T09:00:00.000Z', dataChegada: '2026-11-10T11:30:00.000Z', status: StatusVoo.PROGRAMADO, aeronaveId: aGOL1.id, portaoId: b2.id });
  const vG3202 = await criarVoo({ numero: 'G3202', origem: 'CGH', destino: 'SSA', dataPartida: '2026-11-11T09:00:00.000Z', dataChegada: '2026-11-11T11:30:00.000Z', status: StatusVoo.EMBARCANDO, aeronaveId: aGOL2.id, portaoId: b2.id });
  const vAA4001 = await criarVoo({ numero: 'AA4001', origem: 'GRU', destino: 'MIA', dataPartida: '2026-11-10T22:00:00.000Z', dataChegada: '2026-11-11T06:00:00.000Z', status: StatusVoo.PROGRAMADO, aeronaveId: aAA1.id, portaoId: b3.id });
  const vAA4002 = await criarVoo({ numero: 'AA4002', origem: 'GRU', destino: 'JFK', dataPartida: '2026-11-12T10:00:00.000Z', dataChegada: '2026-11-12T20:00:00.000Z', status: StatusVoo.PROGRAMADO, aeronaveId: aAA2.id, portaoId: b3.id });

  // ═══════════════════════════════════════════════════════════════
  // 6. RESERVAS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n💺 Criando reservas...');
  // Voo 1 (EMBARCANDO, existente): só o user 3 já tem reserva
  await criarReserva(u5.id, 1, '15B');
  await criarReserva(u6.id, 1, '16C');
  await criarReserva(u7.id, 1, '17D');
  await criarReserva(u8.id, 1, '18E');

  // Voo LA2001
  await criarReserva(u3.id, vLA2001.id, '10A');
  await criarReserva(u4.id, vLA2001.id, '11B');
  await criarReserva(u5.id, vLA2001.id, '12C');
  await criarReserva(u6.id, vLA2001.id, '13D');
  await criarReserva(u7.id, vLA2001.id, '14E');

  // Voo LA2002
  await criarReserva(u4.id, vLA2002.id, '20A');
  await criarReserva(u6.id, vLA2002.id, '21B');
  await criarReserva(u8.id, vLA2002.id, '22C');

  // Voo AD3001
  await criarReserva(u3.id, vAD3001.id, '1A');
  await criarReserva(u4.id, vAD3001.id, '2B');
  await criarReserva(u5.id, vAD3001.id, '3C');
  await criarReserva(u7.id, vAD3001.id, '4D');

  // Voo AD3002 (com uma cancelada pra variar)
  await criarReserva(u3.id, vAD3002.id, '5A');
  await criarReserva(u6.id, vAD3002.id, '6B', StatusReserva.CANCELADA);
  await criarReserva(u8.id, vAD3002.id, '7C');

  // Voo G3201
  await criarReserva(u3.id, vG3201.id, '10A');
  await criarReserva(u4.id, vG3201.id, '11B');
  await criarReserva(u5.id, vG3201.id, '12C');
  await criarReserva(u6.id, vG3201.id, '13D');

  // Voo G3202 (EMBARCANDO)
  await criarReserva(u3.id, vG3202.id, '1A');
  await criarReserva(u4.id, vG3202.id, '2B');
  await criarReserva(u7.id, vG3202.id, '3C');
  await criarReserva(u8.id, vG3202.id, '4D');

  // Voo AA4001
  await criarReserva(u3.id, vAA4001.id, '30A');
  await criarReserva(u5.id, vAA4001.id, '31B');
  await criarReserva(u7.id, vAA4001.id, '32C');

  // Voo AA4002
  await criarReserva(u4.id, vAA4002.id, '40A');
  await criarReserva(u5.id, vAA4002.id, '41B');
  await criarReserva(u6.id, vAA4002.id, '42C');
  await criarReserva(u8.id, vAA4002.id, '43D');

  // ═══════════════════════════════════════════════════════════════
  // 7. EMBARQUES (só pra voos em EMBARCANDO ou DECOLADO)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🚶 Criando embarques...');

  // Voo 1 (EMBARCANDO): a reserva do user 3 já tem embarque (criado nos testes manuais)
  // Cria mais alguns pro voo 1 parecer real
  const r5v1 = await prisma.reserva.findFirst({ where: { usuarioId: u5.id, vooId: 1 } });
  const r6v1 = await prisma.reserva.findFirst({ where: { usuarioId: u6.id, vooId: 1 } });
  if (r5v1) {
    const existe = await prisma.embarque.findUnique({ where: { reservaId: r5v1.id } });
    if (!existe) await prisma.embarque.create({ data: { reservaId: r5v1.id, status: 'REALIZADO', observacao: 'Embarque normal' } });
  }
  if (r6v1) {
    const existe = await prisma.embarque.findUnique({ where: { reservaId: r6v1.id } });
    if (!existe) await prisma.embarque.create({ data: { reservaId: r6v1.id, status: 'REALIZADO', observacao: 'Embarque prioritário' } });
  }

  // Voo G3202 (EMBARCANDO): embarques
  const r3g = await prisma.reserva.findFirst({ where: { usuarioId: u3.id, vooId: vG3202.id } });
  const r4g = await prisma.reserva.findFirst({ where: { usuarioId: u4.id, vooId: vG3202.id } });
  if (r3g) {
    const existe = await prisma.embarque.findUnique({ where: { reservaId: r3g.id } });
    if (!existe) await prisma.embarque.create({ data: { reservaId: r3g.id, status: 'REALIZADO' } });
  }
  if (r4g) {
    const existe = await prisma.embarque.findUnique({ where: { reservaId: r4g.id } });
    if (!existe) await prisma.embarque.create({ data: { reservaId: r4g.id, status: 'REALIZADO' } });
  }

  // ═══════════════════════════════════════════════════════════════
  // RESUMO
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════');
  console.log('✅ SEED CONCLUÍDO!');
  console.log('═══════════════════════════════════════════');
  console.log('📧 ADMIN:        admin@aeroporto.com / Admin@123');
  console.log('📧 OPERATOR:     operador@aeroporto.com / Operador@123');
  console.log('📧 PASSENGER:    passageiro@aeroporto.com / Passageiro@123');
  console.log('📧 PASSENGER 2:  passageiro2@aeroporto.com / Passageiro2@123');
  console.log('📧 PASSENGER 3:  maria@aeroporto.com / Maria@123');
  console.log('📧 PASSENGER 4:  joao@aeroporto.com / Joao@123');
  console.log('📧 PASSENGER 5:  ana@aeroporto.com / Ana@123');
  console.log('📧 PASSENGER 6:  carlos@aeroporto.com / Carlos@123');
  console.log('═══════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });