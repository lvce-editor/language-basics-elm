module CaseControl exposing (describe)

describe value =
    case value of
        Just nested ->
            case nested of
                True ->
                    "yes"

                False ->
                    "no"

        Nothing ->
            "empty"

caseValue =
    "case"

offer =
    "of"
