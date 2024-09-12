import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import {ClientRequest} from 'http';
import {notFound, errorHandler} from './middlewares';
import {MessageResponse} from './types/Messages';

const app = express();

app.use(morgan('combined'));
app.use(helmet());
app.use(cors());
app.disable('x-powered-by');
app.use(express.json());

app.get<{}, MessageResponse>('/', (_req: Request, res: Response) => {
  res.json({
    message: 'API location: api/v1',
  });
});

interface ExtendedOptions extends Options {
  onProxyReq?: (proxyReq: ClientRequest) => void;
}

const services = [
  {
    route: '/api1',
    target: 'https://jsonplaceholder.typicode.com/posts',
  },
  {
    route: '/api2',
    target: 'https://catfact.ninja/fact',
  },
  {
    route: '/api3',
    target: 'https://api.openweathermap.org/data/2.5/weather?q=London',
    on: {
      onProxyReq: (proxyReq: ClientRequest) => {
      // Append apikey query parameter to the target URL
      proxyReq.path += '&appid=f3e0b30bb708435af79fa709d74b0750';
      console.log('Request path:', proxyReq.path);
    },
  },
}];

services.forEach(({ route, target, on }) => {
  const proxyOptions = {
    on,
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: '',
    },
    secure: process.env.NODE_ENV === 'production', // Enable SSL verification in production
  };

  app.use(route, createProxyMiddleware(proxyOptions as ExtendedOptions));
});

app.use(notFound);
app.use(errorHandler);

export default app;
