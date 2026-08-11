todoDecoder =
    Decode.succeed Todo

decode =
    let
        todoDecoder =
            localDecoder
    in
    apply todoDecoder

after =
    apply todoDecoder
