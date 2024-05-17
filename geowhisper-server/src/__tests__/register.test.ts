import supertest from "supertest";
import { app } from "../index";
describe("POST", () => {
  describe("register", () => {
    it("Zwraca status 200 i id zarejestrowanego użytkownika", async () => {
      const response = await supertest(app)
        .post(`/register`)
        .send({
          user: {
            name: "name",
            phoneNumber: 333333333,
            directionalNumber: 333,
            password: "password",
          },
        });
      expect(response.statusCode).toBe(200);
      expect(response.body.user).not.toBeNull();
    });
  });
});
