import { UserPersistent } from "../src/shared/domain/models/user";

const TEST_USER_ID = "6152e88f3560e501082c1727";
const TEST_USER_EMAIL = "testuser@mail.com";
const TEST_USER_FIRSTNAME = "Kirill";
const TEST_USER_LASTNAME = "Ushakov";

export const authenticatedUser: UserPersistent = {
  _id: TEST_USER_ID,
  username: TEST_USER_EMAIL,
  firstName: TEST_USER_FIRSTNAME,
  lastName: TEST_USER_LASTNAME,
  verified: true,
};
