/**
 * @enum number
 */
export const State = {
  TopLevelContent: 1,
  Keyword: 2,
  AfterKeyword: 3,
  InsideBlockComment: 4,
  AfterKeywordImport: 5,
  AfterKeywordImportAfterWhitespace: 6,
  AfterTypeColon: 7,
  AfterKeywordType: 8,
  AfterKeywordTypeAfterWhitespace: 9,
  InsideTypeRightHandSide: 10,
  AfterTypeName: 11,
  AfterTypeNameAfterWhitespace: 12,
  InsideLineComment: 13,
  AfterKeywordModule: 14,
  AfterModuleName: 15,
  InsideDoubleQuoteString: 16,
  InsideSingleQuoteString: 17,
  InsideTripleQuoteString: 18,
}

export const StateMap = {
  [State.TopLevelContent]: 'TopLevelContent',
  [State.InsideBlockComment]: 'InsideBlockComment',
  [State.InsideDoubleQuoteString]: 'InsideDoubleQuoteString',
  [State.InsideSingleQuoteString]: 'InsideSingleQuoteString',
  [State.InsideTripleQuoteString]: 'InsideTripleQuoteString',
}

/**
 * @enum number
 */
export const TokenType = {
  None: 1,
  Whitespace: 2,
  PunctuationString: 3,
  String: 4,
  Keyword: 5,
  Numeric: 6,
  Punctuation: 7,
  VariableName: 8,
  Comment: 885,
  Text: 9,
  LanguageConstantBoolean: 10,
  Definition: 11,
  Function: 11,
  Type: 12,
  KeywordImport: 14,
  KeywordControl: 15,
  Class: 16,
}

export const TokenMap = {
  [TokenType.None]: 'None',
  [TokenType.Whitespace]: 'Whitespace',
  [TokenType.PunctuationString]: 'PunctuationString',
  [TokenType.String]: 'String',
  [TokenType.Keyword]: 'Keyword',
  [TokenType.Numeric]: 'Numeric',
  [TokenType.Punctuation]: 'Punctuation',
  [TokenType.VariableName]: 'VariableName',
  [TokenType.Comment]: 'Comment',
  [TokenType.Text]: 'Text',
  [TokenType.LanguageConstantBoolean]: 'LanguageConstant',
  [TokenType.Function]: 'Function',
  [TokenType.Type]: 'Type',
  [TokenType.KeywordImport]: 'KeywordImport',
  [TokenType.KeywordControl]: 'KeywordControl',
  [TokenType.Class]: 'Class',
}

export const initialLineState = {
  state: State.TopLevelContent,
  blockCommentDepth: 0,
}

const keywords = new Set([
  'alias',
  'as',
  'case',
  'else',
  'if',
  'in',
  'infix',
  'infixl',
  'infixr',
  'let',
  'not',
  'of',
  'port',
  'then',
  'type',
  'where',
])

const importKeywords = new Set(['exposing', 'import', 'module'])
const controlKeywords = new Set(['case', 'else', 'if', 'of', 'then'])
const languageConstants = new Set(['False', 'True'])

const RE_IDENTIFIER = /^[A-Za-z_][A-Za-z\d_']*/
const RE_NUMBER =
  /^(?:0[xX][\dA-Fa-f]+|(?:\d+\.\d+|\d+\.|\.\d+|\d+)(?:[eE][+-]?\d+)?)/
const RE_PUNCTUATION = /^[()[\]{}.,:;=|+\-*/<>\\!&^%$#@?~]+/
const RE_WHITESPACE = /^[\t ]+/

export const hasArrayReturn = true

const pushToken = (tokens, type, length) => {
  tokens.push(type, length)
}

const getBlockCommentBoundary = (line, index) => {
  const openIndex = line.indexOf('{-', index)
  const closeIndex = line.indexOf('-}', index)
  if (openIndex === -1) {
    return closeIndex
  }
  if (closeIndex === -1) {
    return openIndex
  }
  return Math.min(openIndex, closeIndex)
}

const isFunctionDefinition = (line, index, name) => {
  if (!/^[a-z_]/.test(name)) {
    return false
  }
  const rest = line.slice(index + name.length)
  if (/^port\s+$/.test(line.slice(0, index))) {
    return /^\s*:/.test(rest)
  }
  const prefix = line.slice(0, index)
  if (prefix.trim()) {
    return false
  }
  if (index === 0) {
    return /^\s*:/.test(rest) || /^\s*=/.test(rest) || /^\s+.*=/.test(rest)
  }
  return /^\s+.+\s*=/.test(rest)
}

const isModuleIdentifier = (line, index) => {
  const modulePrefix = line.match(/^\s*(?:port\s+module|module|import)\s+/)
  if (!modulePrefix || index < modulePrefix[0].length) {
    return false
  }
  const exposingIndex = line.indexOf(' exposing ', modulePrefix[0].length)
  return exposingIndex === -1 || index < exposingIndex
}

const isExposedFunction = (line, index, name) => {
  if (!/^[a-z_]/.test(name)) {
    return false
  }
  const exposingIndex = line.indexOf('exposing')
  return exposingIndex !== -1 && index > exposingIndex
}

const isFunctionApplication = (line, index, name) => {
  if (!/^[a-z_]/.test(name)) {
    return false
  }
  const rest = line.slice(index + name.length)
  if (!/^\s+(?=[A-Za-z\d_'"([{\\-])/.test(rest)) {
    return false
  }
  const prefix = line.slice(0, index).trimEnd()
  if (!prefix) {
    return true
  }
  return /[.([,{=|>]$/.test(prefix)
}

const getUnionConstructor = (line) => {
  const match = line.match(
    /^\s*(?:(?:type\s+[A-Z][A-Za-z\d_']*(?:\s+[a-z][A-Za-z\d_']*)*\s*)?=|\|)\s*([A-Z][A-Za-z\d_']*)/,
  )
  if (!match) {
    return undefined
  }
  return {
    index: match[0].lastIndexOf(match[1]),
    name: match[1],
  }
}

const isTypeIdentifier = (line, index, multilineTypeContext) => {
  const prefix = line.slice(0, index)
  if (multilineTypeContext) {
    return true
  }
  if (/^\s*type(?:\s+alias)?\s*$/.test(prefix)) {
    return true
  }
  if (/^\s*type\s+alias\b/.test(line)) {
    return true
  }
  if (prefix.includes(':')) {
    return true
  }
  if (/\bexposing\s*\([^)]*$/.test(prefix)) {
    return true
  }
  const constructor = getUnionConstructor(line)
  return constructor && index > constructor.index + constructor.name.length
}

/**
 * @param {string} line
 * @param {{state: number, blockCommentDepth?: number, multilineTypeContext?: boolean}} lineState
 */
export const tokenizeLine = (line, lineState) => {
  let index = 0
  let state = lineState.state
  let blockCommentDepth = lineState.blockCommentDepth || 0
  let multilineTypeContext = lineState.multilineTypeContext || false
  const tokens = []

  if (!line.trim() || /^\S/.test(line)) {
    multilineTypeContext = false
  }
  if (/^\s*type\s+alias\b/.test(line) || /^\S.*:\s*$/.test(line)) {
    multilineTypeContext = true
  }

  if (state === State.InsideBlockComment && blockCommentDepth === 0) {
    blockCommentDepth = 1
  }

  while (index < line.length) {
    const part = line.slice(index)

    if (state === State.InsideBlockComment) {
      if (part.startsWith('{-')) {
        pushToken(tokens, TokenType.Comment, 2)
        blockCommentDepth++
        index += 2
        continue
      }
      if (part.startsWith('-}')) {
        pushToken(tokens, TokenType.Comment, 2)
        blockCommentDepth--
        index += 2
        if (blockCommentDepth === 0) {
          state = State.TopLevelContent
        }
        continue
      }
      const boundary = getBlockCommentBoundary(line, index)
      const length = boundary === -1 ? line.length - index : boundary - index
      pushToken(tokens, TokenType.Comment, length)
      index += length
      continue
    }

    if (state === State.InsideTripleQuoteString) {
      if (part.startsWith('"""')) {
        pushToken(tokens, TokenType.PunctuationString, 3)
        index += 3
        state = State.TopLevelContent
        continue
      }
      const closingIndex = line.indexOf('"""', index)
      const length =
        closingIndex === -1 ? line.length - index : closingIndex - index
      pushToken(tokens, TokenType.String, length)
      index += length
      continue
    }

    if (state === State.InsideDoubleQuoteString) {
      if (part.startsWith('"')) {
        pushToken(tokens, TokenType.PunctuationString, 1)
        index++
        state = State.TopLevelContent
        continue
      }
      const match = part.match(/^\\(?:u\{[\dA-Fa-f]+\}|.)/)
      if (match) {
        pushToken(tokens, TokenType.String, match[0].length)
        index += match[0].length
        continue
      }
      const length = part.search(/["\\]/)
      const contentLength = length === -1 ? part.length : Math.max(1, length)
      pushToken(tokens, TokenType.String, contentLength)
      index += contentLength
      continue
    }

    if (state === State.InsideSingleQuoteString) {
      if (part.startsWith("'")) {
        pushToken(tokens, TokenType.PunctuationString, 1)
        index++
        state = State.TopLevelContent
        continue
      }
      const match = part.match(/^\\(?:u\{[\dA-Fa-f]+\}|.)/)
      if (match) {
        pushToken(tokens, TokenType.String, match[0].length)
        index += match[0].length
        continue
      }
      const length = part.search(/['\\]/)
      const contentLength = length === -1 ? part.length : Math.max(1, length)
      pushToken(tokens, TokenType.String, contentLength)
      index += contentLength
      continue
    }

    const whitespace = part.match(RE_WHITESPACE)
    if (whitespace) {
      pushToken(tokens, TokenType.Whitespace, whitespace[0].length)
      index += whitespace[0].length
      continue
    }

    if (part.startsWith('--')) {
      pushToken(tokens, TokenType.Comment, part.length)
      index = line.length
      continue
    }

    if (part.startsWith('{-')) {
      pushToken(tokens, TokenType.Comment, 2)
      blockCommentDepth = 1
      state = State.InsideBlockComment
      index += 2
      continue
    }

    if (part.startsWith('"""')) {
      pushToken(tokens, TokenType.PunctuationString, 3)
      state = State.InsideTripleQuoteString
      index += 3
      continue
    }

    if (part.startsWith('"')) {
      pushToken(tokens, TokenType.PunctuationString, 1)
      state = State.InsideDoubleQuoteString
      index++
      continue
    }

    if (part.startsWith("'")) {
      pushToken(tokens, TokenType.PunctuationString, 1)
      state = State.InsideSingleQuoteString
      index++
      continue
    }

    const number = part.match(RE_NUMBER)
    if (number) {
      pushToken(tokens, TokenType.Numeric, number[0].length)
      index += number[0].length
      continue
    }

    const identifier = part.match(RE_IDENTIFIER)
    if (identifier) {
      const name = identifier[0]
      let type = TokenType.VariableName
      if (importKeywords.has(name)) {
        type = TokenType.KeywordImport
      } else if (controlKeywords.has(name)) {
        type = TokenType.KeywordControl
      } else if (keywords.has(name)) {
        type = TokenType.Keyword
      } else if (languageConstants.has(name)) {
        type = TokenType.LanguageConstantBoolean
      } else if (isFunctionDefinition(line, index, name)) {
        type = TokenType.Function
      } else if (isExposedFunction(line, index, name)) {
        type = TokenType.Function
      } else if (isFunctionApplication(line, index, name)) {
        type = TokenType.Function
      } else if (isModuleIdentifier(line, index)) {
        type = TokenType.VariableName
      } else if (line[index + name.length] === '.') {
        type = TokenType.VariableName
      } else if (/^[A-Z]/.test(name)) {
        type = isTypeIdentifier(line, index, multilineTypeContext)
          ? TokenType.Type
          : TokenType.Class
      }
      pushToken(tokens, type, name.length)
      index += name.length
      continue
    }

    const punctuation = part.match(RE_PUNCTUATION)
    if (punctuation) {
      pushToken(tokens, TokenType.Punctuation, punctuation[0].length)
      index += punctuation[0].length
      continue
    }

    pushToken(tokens, TokenType.Text, 1)
    index++
  }

  if (
    state === State.InsideDoubleQuoteString ||
    state === State.InsideSingleQuoteString
  ) {
    state = State.TopLevelContent
  }

  return {
    state,
    blockCommentDepth,
    multilineTypeContext,
    tokens,
  }
}
