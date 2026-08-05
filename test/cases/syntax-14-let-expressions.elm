module LetExpressions exposing (total)

total values =
    let
        double value =
            value * 2

        doubled =
            List.map double values
    in
    List.sum doubled
