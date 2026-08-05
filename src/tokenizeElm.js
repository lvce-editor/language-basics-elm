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
}

export const StateMap = {
  [State.TopLevelContent]: 'TopLevelContent',
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
  Type: 12,
  KeywordImport: 14,
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
  [TokenType.Definition]: 'Type',
  [TokenType.Type]: 'Type',
  [TokenType.KeywordImport]: 'KeywordImport',
}

export const initialLineState = {
  state: State.TopLevelContent,
}

const RE_WHITESPACE = /^\s+/
const RE_WHITESPACE_SINGLE_LINE = /^( |\t)+/
const RE_WHITESPACE_NEWLINE = /^\n/
const RE_STRING_DOUBLE_QUOTE_CONTENT = /^[^"\\\n]+/
const RE_STRING_SINGLE_QUOTE_CONTENT = /^[^'\\\n]+/
const RE_DOUBLE_QUOTE = /^"/
const RE_COLON = /^:/
const RE_NUMERIC =
  /^((0(x|X)[0-9a-fA-F]*)|(([0-9]+\.?[0-9]*)|(\.[0-9]+))((e|E)(\+|-)?[0-9]+)?)\b/

const RE_KEYWORD =
  /^(?:where|type|True|then|port|of|module|let|in|import|if|False|exposing|else|case|as)\b/
const RE_TYPE_NAME = /^[A-Z][a-zA-Z\d_']*/
const RE_VARIABLE_NAME = /^[a-z_][a-zA-Z\d_']*/
const RE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z\d_']*/
const RE_EQUAL_SIGN = /^=/
const RE_SINGLE_QUOTE = /^'/
const RE_LINE_COMMENT = /^\-\-[^\n]*/
const RE_BLOCK_COMMENT_START = /^\{\-/
const RE_BLOCK_COMMENT_END = /^\-\}/
const RE_BLOCK_COMMENT_CONTENT = /^.+(?=\-\})/s
const RE_STRING_ESCAPE = /^\\./
const RE_BACKSLASH = /^\\/
const RE_PUNCTUATION = /^[()\[\]{}.,|=:;+\-*\/<>\\!&^%$#@?~]+/
const RE_WORD_ALIAS = /^alias/
const RE_ANYTHING_UNTIL_END = /^.+/s

export const hasArrayReturn = true

/**
 * @param {string} line
 * @param {any} lineState
 */
export const tokenizeLine = (line, lineState) => {
  let next = null
  let index = 0
  let tokens = []
  let token = TokenType.None
  let state = lineState.state
  if (line.length === 0 && state !== State.InsideBlockComment) {
    state = State.TopLevelContent
  } else if (state === State.AfterTypeColon) {
    state = State.TopLevelContent
  } else if (
    (state === State.AfterTypeName ||
      state === State.AfterTypeNameAfterWhitespace ||
      state === State.InsideTypeRightHandSide) &&
    !RE_WHITESPACE_SINGLE_LINE.test(line)
  ) {
    state = State.TopLevelContent
  }
  while (index < line.length) {
    const part = line.slice(index)
    switch (state) {
      case State.TopLevelContent:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.TopLevelContent
        } else if ((next = part.match(RE_KEYWORD))) {
          state = State.Keyword
          continue
        } else if ((next = part.match(RE_TYPE_NAME))) {
          token = TokenType.Type
          state = State.TopLevelContent
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.VariableName
          state = State.TopLevelContent
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.TopLevelContent
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_BLOCK_COMMENT_START))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideDoubleQuoteString
        } else if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideSingleQuoteString
        } else if ((next = part.match(RE_COLON))) {
          token = TokenType.Punctuation
          state = State.AfterTypeColon
        } else if ((next = part.match(RE_PUNCTUATION))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_ANYTHING_UNTIL_END))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          throw new Error('no')
        }
        break
      case State.InsideBlockComment:
        if ((next = part.match(RE_BLOCK_COMMENT_END))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_BLOCK_COMMENT_CONTENT))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else if ((next = part.match(RE_ANYTHING_UNTIL_END))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.InsideDoubleQuoteString:
        if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_STRING_DOUBLE_QUOTE_CONTENT))) {
          token = TokenType.String
          state = State.InsideDoubleQuoteString
        } else if ((next = part.match(RE_STRING_ESCAPE))) {
          token = TokenType.String
          state = State.InsideDoubleQuoteString
        } else if ((next = part.match(RE_BACKSLASH))) {
          token = TokenType.String
          state = State.InsideDoubleQuoteString
        } else {
          throw new Error('no')
        }
        break
      case State.InsideSingleQuoteString:
        if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_STRING_SINGLE_QUOTE_CONTENT))) {
          token = TokenType.String
          state = State.InsideSingleQuoteString
        } else if ((next = part.match(RE_STRING_ESCAPE))) {
          token = TokenType.String
          state = State.InsideSingleQuoteString
        } else if ((next = part.match(RE_BACKSLASH))) {
          token = TokenType.String
          state = State.InsideSingleQuoteString
        } else {
          throw new Error('no')
        }
        break
      case State.Keyword:
        const keyword = next[0]
        switch (keyword) {
          case 'import':
          case 'exposing':
            token = TokenType.KeywordImport
            state = State.TopLevelContent
            break
          case 'False':
          case 'True':
            token = TokenType.LanguageConstantBoolean
            state = State.TopLevelContent
            break
          case 'type':
            token = TokenType.Keyword
            state = State.AfterKeywordType
            break
          case 'module':
            token = TokenType.KeywordImport
            state = State.AfterKeywordModule
            break
          default:
            token = TokenType.Keyword
            state = State.TopLevelContent
            break
        }
        break
      case State.AfterKeywordType:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterKeywordTypeAfterWhitespace
        } else {
          throw new Error('no')
        }
        break
      case State.AfterKeywordTypeAfterWhitespace:
        if ((next = part.match(RE_WORD_ALIAS))) {
          token = TokenType.Keyword
          state = State.AfterKeywordType
        } else if ((next = part.match(RE_IDENTIFIER))) {
          token = TokenType.Type
          state = State.AfterTypeName
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterTypeName:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterTypeNameAfterWhitespace
        } else {
          throw new Error('no')
        }
        break
      case State.AfterTypeNameAfterWhitespace:
        if ((next = part.match(RE_EQUAL_SIGN))) {
          token = TokenType.Punctuation
          state = State.InsideTypeRightHandSide
        } else {
          part //?
          part.startsWith('M') //?
          throw new Error('no')
        }
        break
      case State.InsideTypeRightHandSide:
        if ((next = part.match(RE_KEYWORD))) {
          state = State.Keyword
          continue
        } else if ((next = part.match(RE_IDENTIFIER))) {
          token = TokenType.Type
          state = State.InsideTypeRightHandSide
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.InsideTypeRightHandSide
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_PUNCTUATION))) {
          token = TokenType.Punctuation
          state = State.InsideTypeRightHandSide
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterTypeColon:
        if ((next = part.match(RE_WHITESPACE_SINGLE_LINE))) {
          token = TokenType.Whitespace
          state = State.AfterTypeColon
        } else if ((next = part.match(RE_IDENTIFIER))) {
          token = TokenType.Type
          state = State.AfterTypeColon
        } else if ((next = part.match(RE_WHITESPACE_NEWLINE))) {
          token = TokenType.Whitespace
          state = State.TopLevelContent
        } else if ((next = part.match(RE_PUNCTUATION))) {
          token = TokenType.Punctuation
          state = State.AfterTypeColon
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterKeywordModule:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterKeywordModule
        } else if ((next = part.match(RE_TYPE_NAME))) {
          token = TokenType.Type
          state = State.AfterModuleName
        } else {
          throw new Error('no')
        }
        break
      case State.AfterModuleName:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.TopLevelContent
        } else {
          throw new Error('no')
        }
        break
      default:
        throw new Error('no')
    }
    const tokenLength = next[0].length
    index += tokenLength
    tokens.push(token, tokenLength)
  }
  if (state === State.InsideLineComment) {
    state = State.TopLevelContent
  }
  return {
    state,
    tokens,
  }
}

tokenizeLine(`port module Main exposing (..)`, initialLineState)
