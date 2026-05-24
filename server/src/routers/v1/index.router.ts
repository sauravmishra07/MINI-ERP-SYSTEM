import express from 'express';
import pingRouter from './ping.router';
import authRouter from './auth.router';
import requestRouter from './request.router';
import dashboardRouter from './dashboard.router';

const v1Router = express.Router();

v1Router.use('/ping', pingRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/requests', requestRouter);
v1Router.use('/dashboard', dashboardRouter);

export default v1Router;