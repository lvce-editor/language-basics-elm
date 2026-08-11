todoDecoder =
    Decode.succeed Todo

decode todoDecoder =
    todoDecoder input

after =
    use todoDecoder
