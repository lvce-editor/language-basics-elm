module LocalFunctions exposing (calculate)

calculate values =
    let
        double value =
            value * 2

        total =
            List.sum values
    in
    List.map double values
        |> List.append [ total ]
