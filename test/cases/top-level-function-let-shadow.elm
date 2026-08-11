todoDecoder =
    Decode.succeed Todo

decode =
    let
        todoDecoder input =
            input

        decoded =
            todoDecoder value
    in
    todoDecoder value

after =
    use todoDecoder
