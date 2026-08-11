decoder' =
    Decode.succeed Todo

request =
    Http.expectJson GotTodo decoder'

decode decoder' =
    decoder' input

after =
    use decoder'
