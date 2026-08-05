module Records exposing (rename)

person =
    { name = "Ada", age = 36 }

rename name model =
    { model | name = name }
