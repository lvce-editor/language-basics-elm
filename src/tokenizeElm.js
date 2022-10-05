/**
 * @enum number
 */
export const TokenType = {
  Text: 1,
}

export const TokenMap = {
  [TokenType.Text]: 'Text',
}

export const initialLineState = {
  state: 1,
  tokens: [],
}

export const hasArrayReturn = true

/**
 * @param {string} line
 */
export const tokenizeLine = (line) => {
  const tokens = [TokenType.Text, line.length]
  return {
    state: 1,
    tokens,
  }
}
