import morgan from 'morgan';
import { env } from '../config/env';

const getMorganFormat = () => {
  return env.NODE_ENV === 'production' ? 'combined' : 'dev';
};

export const morganRequestLogger = morgan(getMorganFormat());
