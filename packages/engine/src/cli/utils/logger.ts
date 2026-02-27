import pc from 'picocolors';

export const logger = {
  info(msg: string) {
    console.log(pc.blue('[mapper]'), msg);
  },
  success(msg: string) {
    console.log(pc.blue('[mapper]'), pc.green(msg));
  },
  warn(msg: string) {
    console.log(pc.blue('[mapper]'), pc.yellow(msg));
  },
  error(msg: string) {
    console.error(pc.blue('[mapper]'), pc.red(msg));
  },
};

