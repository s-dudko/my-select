// https://dirask.com/posts/JavaScript-UUID-function-in-Vanilla-JS-1X9kgD
export const createUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const randomNumber = Math.random() * 16 | 0;
    const value = char == 'x' ? randomNumber : (randomNumber & 0x3 | 0x8);

    return value.toString(16);
  });
};
