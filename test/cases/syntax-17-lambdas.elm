module Lambdas exposing (incrementAll)

incrementAll values =
    values
        |> List.map (\value -> value + 1)
        |> List.filter (\value -> value > 1)
