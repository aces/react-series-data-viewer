import axios from 'axios';

export const fetchBlob = (...args) =>
  axios(...args, {responseType: 'blob'}).then(({data}) => data);

export const fetchJSON = (...args) =>
  axios(...args, {responseType: 'json'}).then(({data}) => data);

export const fetchText = (...args) =>
  axios(...args, {responseType: 'text'}).then(({data}) => data);
