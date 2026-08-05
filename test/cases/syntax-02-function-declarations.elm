module FunctionDeclarations exposing (add, greet)

add : Int -> Int -> Int
add left right =
    left + right

greet name =
    "Hello, " ++ name
