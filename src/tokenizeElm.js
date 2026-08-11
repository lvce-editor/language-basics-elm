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
  KeywordOperator: 17,
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
  [TokenType.KeywordOperator]: 'KeywordOperator',
}

export const initialLineState = {
  state: State.TopLevelContent,
  blockCommentDepth: 0,
  knownTopLevelFunctions: [],
  localScopes: [],
  topLevelBindings: [],
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
  'of',
  'port',
  'then',
  'type',
])

const importKeywords = new Set(['exposing', 'import', 'module', 'where'])
const controlKeywords = new Set(['as', 'case', 'else', 'if', 'of', 'then'])
const operatorKeywords = new Set(['not'])
const languageConstants = new Set(['False', 'Just', 'Nothing', 'True'])
const knownQualifiedFunctions = new Set(['List.indexedMap'])
const bindingKeywords = new Set([
  ...keywords,
  ...importKeywords,
  ...controlKeywords,
  ...operatorKeywords,
])

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
  if (/^\s*=/.test(rest)) {
    return false
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

const isKnownQualifiedFunction = (line, index, name) => {
  if (!/^[a-z_]/.test(name)) {
    return false
  }
  const prefix = line.slice(0, index)
  const match = prefix.match(
    /(?:^|[^A-Za-z\d_'])([A-Z][A-Za-z\d_']*(?:\.[A-Z][A-Za-z\d_']*)*\.)$/,
  )
  if (!match) {
    return false
  }
  return (
    match[1].startsWith('Html.') || knownQualifiedFunctions.has(match[1] + name)
  )
}

const isFunctionBoundary = (prefix) => {
  return (
    /[.([,{]$/.test(prefix) ||
    /(?:^|[^=<>/])=$/.test(prefix) ||
    /(?:->|\|>)$/.test(prefix)
  )
}

const isFunctionApplication = (line, index, name) => {
  if (!/^[a-z_]/.test(name)) {
    return false
  }
  const prefix = line.slice(0, index).trimEnd()
  if (/(?:^|\s)\|>\s*(?:[A-Z][A-Za-z\d_']*\.)*$/.test(prefix)) {
    return true
  }
  const rest = line.slice(index + name.length)
  if (/^\s*->/.test(rest)) {
    return false
  }
  if (!/^\s+(?=[A-Za-z\d_'"([{\\-])/.test(rest)) {
    return false
  }
  if (!prefix) {
    return true
  }
  return isFunctionBoundary(prefix)
}

const getIndentation = (line) => {
  return line.match(/^[\t ]*/)[0].length
}

const getBindingNames = (pattern) => {
  const names = []
  for (const match of pattern.matchAll(/\b[a-z_][A-Za-z\d_']*/g)) {
    const name = match[0]
    if (name !== '_' && !bindingKeywords.has(name) && !names.includes(name)) {
      names.push(name)
    }
  }
  return names
}

const getDefinition = (line) => {
  const annotation = line.match(/^(?:port\s+)?([a-z_][A-Za-z\d_']*)\s*:/)
  if (annotation) {
    return {
      name: annotation[1],
      parameters: [],
    }
  }
  const definition = line.match(/^([a-z_][A-Za-z\d_']*)([^=]*)=(?!=)/)
  if (!definition || bindingKeywords.has(definition[1])) {
    return undefined
  }
  return {
    name: definition[1],
    parameters: getBindingNames(definition[2]),
  }
}

const maskNonCode = (line, lineState) => {
  const masked = [...line]
  let state = lineState.state
  let blockCommentDepth = lineState.blockCommentDepth || 0
  let index = 0
  const mask = (length) => {
    masked.fill(' ', index, index + length)
    index += length
  }
  while (index < line.length) {
    const part = line.slice(index)
    if (state === State.InsideBlockComment) {
      if (part.startsWith('{-')) {
        blockCommentDepth++
        mask(2)
      } else if (part.startsWith('-}')) {
        blockCommentDepth--
        mask(2)
        if (blockCommentDepth === 0) {
          state = State.TopLevelContent
        }
      } else {
        mask(1)
      }
      continue
    }
    if (state === State.InsideTripleQuoteString) {
      if (part.startsWith('"""')) {
        mask(3)
        state = State.TopLevelContent
      } else {
        mask(1)
      }
      continue
    }
    if (
      state === State.InsideDoubleQuoteString ||
      state === State.InsideSingleQuoteString
    ) {
      const quote = state === State.InsideDoubleQuoteString ? '"' : "'"
      if (part.startsWith('\\')) {
        mask(Math.min(2, part.length))
      } else if (part.startsWith(quote)) {
        mask(1)
        state = State.TopLevelContent
      } else {
        mask(1)
      }
      continue
    }
    if (part.startsWith('--')) {
      mask(part.length)
    } else if (part.startsWith('{-')) {
      blockCommentDepth = 1
      state = State.InsideBlockComment
      mask(2)
    } else if (part.startsWith('"""')) {
      state = State.InsideTripleQuoteString
      mask(3)
    } else if (part.startsWith('"')) {
      state = State.InsideDoubleQuoteString
      mask(1)
    } else if (
      part.startsWith("'") &&
      !/[A-Za-z\d_']/.test(line[index - 1] || '')
    ) {
      state = State.InsideSingleQuoteString
      mask(1)
    } else {
      index++
    }
  }
  return masked.join('')
}

const cloneLocalScopes = (localScopes = []) => {
  return localScopes.map((scope) => ({
    ...scope,
    names: [...scope.names],
  }))
}

const addNames = (target, names) => {
  for (const name of names) {
    if (!target.includes(name)) {
      target.push(name)
    }
  }
}

const getLocalDefinition = (code, indentation) => {
  const content = code.slice(indentation)
  const definition = content.match(/^([^=]+)=(?!=)/)
  if (!definition || /^in\b/.test(content)) {
    return undefined
  }
  const names = getBindingNames(definition[1])
  if (names.length === 0) {
    return undefined
  }
  if (/^[a-z_]/.test(content)) {
    return {
      bindingNames: [names[0]],
      parameterNames: names.slice(1),
    }
  }
  return {
    bindingNames: names,
    parameterNames: [],
  }
}

const prepareBindingState = (line, lineState) => {
  const code = maskNonCode(line, lineState)
  const indentation = getIndentation(line)
  const hasLayoutContent = code.trim().length > 0
  const isTopLevel = hasLayoutContent && indentation === 0
  let topLevelBindings = [...(lineState.topLevelBindings || [])]
  let localScopes = cloneLocalScopes(lineState.localScopes)
  let knownTopLevelFunctions = lineState.knownTopLevelFunctions || []

  if (isTopLevel) {
    topLevelBindings = []
    localScopes = []
  } else if (hasLayoutContent) {
    localScopes = localScopes.filter((scope) => {
      return scope.kind === 'let'
        ? indentation >= scope.indent
        : indentation > scope.indent
    })
  }

  const inheritedLocalNames = localScopes.flatMap((scope) => scope.names)
  const lineBindings = []
  const addLineBinding = (start, names) => {
    if (names.length > 0) {
      lineBindings.push({ start, names })
    }
  }

  if (isTopLevel) {
    const definition = getDefinition(code)
    if (definition) {
      if (!knownTopLevelFunctions.includes(definition.name)) {
        knownTopLevelFunctions = [...knownTopLevelFunctions, definition.name]
      }
      topLevelBindings = definition.parameters
    }
  }

  const letMatches = [...code.matchAll(/\blet\b/g)]
  for (const match of letMatches) {
    const start = match.index + match[0].length
    const afterLet = code.slice(start)
    const definition = afterLet.match(/^\s*([^=\n]+)=(?!=)/)
    const names = definition ? getBindingNames(definition[1]) : []
    addLineBinding(start, names)
    localScopes.push({
      kind: 'let',
      indent: indentation,
      bindingIndent: undefined,
      names: [...names],
    })
  }

  const letScope = localScopes.findLast((scope) => scope.kind === 'let')
  if (!isTopLevel && hasLayoutContent && letScope) {
    const canBeBinding =
      letScope.bindingIndent === undefined ||
      letScope.bindingIndent === indentation
    if (canBeBinding && indentation > letScope.indent) {
      const definition = getLocalDefinition(code, indentation)
      if (definition) {
        letScope.bindingIndent = indentation
        addNames(letScope.names, definition.bindingNames)
        addLineBinding(indentation, definition.bindingNames)
        if (definition.parameterNames.length > 0) {
          addLineBinding(indentation, definition.parameterNames)
          localScopes.push({
            kind: 'layout',
            indent: indentation,
            names: definition.parameterNames,
          })
        }
      }
    }
  }

  for (const match of code.matchAll(/\\([^\n]*?)->/g)) {
    const names = getBindingNames(match[1])
    addLineBinding(match.index, names)
    if (names.length > 0) {
      localScopes.push({ kind: 'layout', indent: indentation, names })
    }
  }

  for (const match of code.matchAll(/->/g)) {
    const arrowIndex = match.index
    if (isTopLevel && !code.slice(0, arrowIndex).includes('=')) {
      continue
    }
    const previousArrowIndex = code.lastIndexOf('->', arrowIndex - 1)
    const lambdaIndex = code.lastIndexOf('\\', arrowIndex)
    if (lambdaIndex > previousArrowIndex) {
      continue
    }
    const ofIndex = code.lastIndexOf(' of ', arrowIndex)
    const patternStart = ofIndex === -1 ? indentation : ofIndex + 4
    const names = getBindingNames(code.slice(patternStart, arrowIndex))
    addLineBinding(patternStart, names)
    if (names.length > 0) {
      localScopes.push({ kind: 'layout', indent: indentation, names })
    }
  }

  return {
    inheritedLocalNames,
    knownTopLevelFunctions,
    lineBindings,
    localScopes,
    topLevelBindings,
  }
}

const isShadowed = (
  name,
  index,
  topLevelBindings,
  inheritedLocalNames,
  lineBindings,
) => {
  if (topLevelBindings.includes(name) || inheritedLocalNames.includes(name)) {
    return true
  }
  return lineBindings.some(
    (binding) => index >= binding.start && binding.names.includes(name),
  )
}

const isRecordFieldName = (line, index, name) => {
  const prefix = line.slice(0, index)
  const openIndex = prefix.lastIndexOf('{')
  const closeIndex = prefix.lastIndexOf('}')
  if (openIndex <= closeIndex) {
    return false
  }
  return /^\s*[:=]/.test(line.slice(index + name.length))
}

const isTypeContext = (line, index, multilineTypeContext) => {
  return multilineTypeContext || line.slice(0, index).includes(':')
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
  const constructor = getUnionConstructor(line)
  return constructor && index > constructor.index + constructor.name.length
}

/**
 * @param {string} line
 * @param {{state: number, blockCommentDepth?: number, multilineTypeContext?: boolean, knownTopLevelFunctions?: string[], localScopes?: any[], topLevelBindings?: string[]}} lineState
 */
export const tokenizeLine = (line, lineState) => {
  let index = 0
  let state = lineState.state
  let blockCommentDepth = lineState.blockCommentDepth || 0
  let multilineTypeContext = lineState.multilineTypeContext || false
  const {
    inheritedLocalNames,
    knownTopLevelFunctions,
    lineBindings,
    localScopes,
    topLevelBindings,
  } = prepareBindingState(line, lineState)
  const knownTopLevelFunctionSet = new Set(knownTopLevelFunctions)
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
      const shadowed = isShadowed(
        name,
        index,
        topLevelBindings,
        inheritedLocalNames,
        lineBindings,
      )
      let type = TokenType.VariableName
      if (importKeywords.has(name)) {
        type = TokenType.KeywordImport
      } else if (controlKeywords.has(name)) {
        type = TokenType.KeywordControl
      } else if (operatorKeywords.has(name)) {
        type = TokenType.KeywordOperator
      } else if (keywords.has(name)) {
        type = TokenType.Keyword
      } else if (languageConstants.has(name)) {
        type = TokenType.LanguageConstantBoolean
      } else if (isFunctionDefinition(line, index, name)) {
        type = TokenType.Function
      } else if (isExposedFunction(line, index, name)) {
        type = TokenType.Function
      } else if (isKnownQualifiedFunction(line, index, name)) {
        type = TokenType.Function
      } else if (
        !shadowed &&
        line[index - 1] !== '.' &&
        !isRecordFieldName(line, index, name) &&
        !isTypeContext(line, index, multilineTypeContext) &&
        knownTopLevelFunctionSet.has(name)
      ) {
        type = TokenType.Function
      } else if (!shadowed && isFunctionApplication(line, index, name)) {
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
    knownTopLevelFunctions,
    localScopes,
    multilineTypeContext,
    topLevelBindings,
    tokens,
  }
}
