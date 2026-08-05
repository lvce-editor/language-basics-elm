module IfElse exposing (label)

label count =
    if count == 0 then
        "none"

    else if count == 1 then
        "one"

    else
        "many"
