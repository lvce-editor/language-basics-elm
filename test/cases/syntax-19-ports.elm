port module Ports exposing (send, receive)

port send : String -> Cmd msg

port receive : (String -> msg) -> Sub msg
