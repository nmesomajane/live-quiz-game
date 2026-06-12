


const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(length = 4) {
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    code += CHARACTERS[randomIndex];
  }
  return code;
}

export function generateUniqueCode(sessionStore, length = 4) {
  let code;
  let attempts = 0;

  do {
    code = generateCode(length);
    attempts++;
    if (attempts > 100) length = 6;
  } while (sessionStore.getSession(code));

  return code;
}