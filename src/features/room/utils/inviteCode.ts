const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 6;

export function generateInviteCode() {
  const randomValues = new Uint32Array(INVITE_CODE_LENGTH);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues, (value) => {
    const index = value % INVITE_CODE_ALPHABET.length;
    return INVITE_CODE_ALPHABET[index];
  }).join("");
}
