import pc from 'picocolors';

export const logger = {
  debug(msg: string, ...args: any[]) {
    console.debug(pc.blue('[mapper]'), pc.cyan(msg), ...args);
  },
  info(msg: string, ...args: any[]) {
    console.log(pc.blue('[mapper]'), msg, ...args);
  },
  success(msg: string, ...args: any[]) {
    console.log(pc.blue('[mapper]'), pc.green(msg), ...args);
  },
  warn(msg: string, ...args: any[]) {
    console.log(pc.blue('[mapper]'), pc.yellow(msg), ...args);
  },
  error(msg: string, ...args: any[]) {
    console.error(pc.blue('[mapper]'), pc.red(msg), ...args);
  },
};

