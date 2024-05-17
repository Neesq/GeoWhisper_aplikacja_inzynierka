import axios from "axios";

const url = "https://geowhisper-aplikacja-inzynierka.onrender.com";
// const url = "http://192.168.1.55:3000";
export const axiosInstance = axios.create({
  baseURL: url,
});
