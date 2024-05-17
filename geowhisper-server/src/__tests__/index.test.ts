import supertest from "supertest";
import { app } from "../index";
describe("GET", () => {
  describe("getUserName", () => {
    it("Zwraca status 200, z wiadomością nie znaleziono użytkownika.", async () => {
      const response = await supertest(app).get(`/get-user-name/id`);
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Nie znaleziono użytkownika.");
    });
    it("Zwraca status 404", async () => {
      const response = await supertest(app).get(`/get-user-name`);
      expect(response.statusCode).toBe(404);
    });
    it("Zwraca status 200, z nazwą użytkownika", async () => {
      const response = await supertest(app).get(
        `/get-user-name/5556901f-19f4-4fdf-9faf-ee44df4882a7`
      );
      expect(response.statusCode).toBe(200);
      expect(response.body.userName).toBe("użytkownik#nfs9zm");
    });
  });
});
