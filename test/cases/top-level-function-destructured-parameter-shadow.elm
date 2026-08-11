todoDecoder =
    Decode.succeed Todo

decode ( todoDecoder, input ) =
    todoDecoder input

after =
    use todoDecoder
