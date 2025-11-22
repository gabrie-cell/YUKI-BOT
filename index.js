
import { Boom } from '@hapi/boom';
import {
  default as makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';
import cfonts from 'cfonts';
import chalk from 'chalk';
import handler from './handler.js';

const logger = pino({ level: 'silent' });

const { say } = cfonts;

say('GOJO BOT', {
  font: 'block',
  align: 'center',
  colors: ['yellowBright']
});

say(`Made With By ABRAHAN-M Y STAFF GOJO`, {
  font: 'console',
  align: 'center',
  colors: ['cyan']
});

function connectToWhatsApp() {
  return new Promise(async (resolve, reject) => {
    const { state, saveCreds } = await useMultiFileAuthState('.auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

    let opcion;
    if (!state.creds || !state.creds.registered) {
      const colores = chalk.bgMagenta.white;
      const opcionQR = chalk.bold.green;
      const opcionTexto = chalk.bold.cyan;
      do {
        opcion = await question(colores('⌨ Seleccione una opción:\n') + opcionQR('1. Con código QR\n') + opcionTexto('2. Con código de texto de 8 dígitos\n--> '));
        if (!/^[1-2]$/.test(opcion)) {
          console.log(chalk.bold.redBright(`✦ No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales.`));
        }
      } while (opcion !== '1' && opcion !== '2');
    }

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: opcion === '1',
      logger,
      browser: ['Chrome (Linux)', '', ''],
    });

    if (opcion === '2' && !sock.authState.creds.registered) {
      const phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(`✦ Por favor, Ingrese el número de WhatsApp.\n${chalk.bold.yellowBright(`✏  Ejemplo: 50584xxxxxx`)}\n${chalk.bold.magentaBright('---> ')}`)));
      const code = await sock.requestPairingCode(phoneNumber.trim());
      console.log(chalk.bold.white(chalk.bgMagenta(`✧ CÓDIGO DE VINCULACIÓN ✧`)), chalk.bold.white(chalk.white(code)));
      rl.close();
    }

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
        if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
          console.log(chalk.bold.redBright(`Connection closed permanently, please delete .auth_info_baileys folder and restart.`));
          reject(new Error('Permanent connection error'));
        } else {
          console.log(chalk.bold.yellowBright(`Connection closed, reconnecting... Reason: ${DisconnectReason[reason] || 'Unknown'}`));
          resolve();
        }
      } else if (connection === 'open') {
        console.log(chalk.bold.green('\nKennyBot Conectado con éxito.'));
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      if (!m.messages) return;
      const msg = m.messages[0];
      await handler(sock, msg);
    });
  });
}

async function startBot() {
  while (true) {
    try {
      await connectToWhatsApp();
    } catch (error) {
      console.error('Bot stopped due to an unrecoverable error:', error);
      break;
    }
    console.log("Reconnecting...");
  }
}

startBot();
