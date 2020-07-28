import {ToyReact, Component} from "./ToyReact.js";

class MyComponent extends Component{
    render(){
        return <div>
                    <span>hello</span>
                    <span>world</span>
                    {true}
                </div>
    }
}

const a = <MyComponent name="div">
              123
          </MyComponent>

ToyReact.render(
    a,
    document.body
)

