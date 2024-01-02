import bcrypt from "bcryptjs"
export const comparePasswords = (password: string, hash: string) => bcrypt.compareSync(password, hash)
export const hashPassword = (password: string) => bcrypt.hashSync(password, 10)
