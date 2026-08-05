module CaseExpressions exposing (describe)

describe maybeValue =
    case maybeValue of
        Just value ->
            value

        Nothing ->
            "empty"
