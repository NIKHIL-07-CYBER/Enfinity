import serverless from 'serverless-http';
import { appInstance } from '../../index';

export const handler = serverless(appInstance);
