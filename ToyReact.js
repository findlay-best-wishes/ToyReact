let childrenSymbol = Symbol("children")
class ElementWrapper{
    constructor(type){
        this.type = type;
        this.props = Object.create(null);
        this[childrenSymbol] = []
        this.children = [];
    }

    setAttribute(name, value){
        this.props[name] = value;
    }

    appendChild(vchild){
        this[childrenSymbol].push(vchild);
        this.children.push(vchild.vdom)
    }

    get vdom(){
        return this;
    }

    mountTo(range){
        this.range = range;

        const placeholder = document.createComment("placeholder");
        const endRange = document.createRange();
        endRange.setStart(range.endContainer, range.endOffset);
        endRange.setEnd(range.endContainer, range.endOffset);
        endRange.insertNode(placeholder);

        range.deleteContents();
        const element = document.createElement(this.type);

        for(let name in this.props){
            let value = this.props[name]

            if(name.match(/^on([\s\S]+)$/)){
                const eventName = RegExp.$1.replace(/[\s\S]/, s => s.toLowerCase());
                element.addEventListener(eventName, value);
            }
            if(name === "className")
                element.setAttribute("class",value);
            element.setAttribute(name, value);
        }

        for(let child of this.children){
            let range = document.createRange();
            if(element.children.length){
                range.setStartAfter(element.lastChild);
                range.setEndAfter(element.lastChild); 
            }
            else{
                range.setStart(element, 0);
                range.setEnd(element, 0);
            }
            child.mountTo(range);
        }
        range.insertNode(element);
    }
}

class TextWrapper{
    constructor(content){
        this.root = document.createTextNode(content);
        this.type = "textNode";
        this.props = Object.create(null),
        this.children = [];
    }

    get vdom(){
        return this
    }
    mountTo(range){
        this.range = range;
        range.deleteContents();
        range.insertNode(this.root);
    }
}

export class Component {
    constructor(){
        this.children = [];
        this.props = Object.create(null);
    }

    get type(){
        return this.constructor.name;
    }

    setAttribute(name, value){
        this.props[name] = value;
        this[name] = value;
    }
    mountTo(range){
        this.range = range
        this.update()
    }

    get vdom(){
        return this.render().vdom;
    }

    update(){
        const vdom = this.vdom;
        if(this.oldVdom) {
            const isSameNode = (node1, node2) => {
                if(node1.type !== node2.type)
                    return false;
                for(let name in node1.props){

                    /* if(typeof node1.props[name] === "function" && typeof node2.props[name] === "function"
                        && node1.props[name].toString === node2.props.toString())
                        continue; */
                    
                    if(typeof node1.props[name] === "object" && typeof node2.props[name] === "object"
                        && JSON.stringify(node1.props[name]) === JSON.stringify(node2.props[name]))
                        continue;

                    if(node1.props[name] !== node2.props[name])
                        return false;
                }
                    
                if(Object.keys(node1.props).length !== Object.keys(node2.props).length)
                    return false;
                return true;
            }

            const isSameTree = (node1, node2) => {
                if(!isSameNode(node1, node2))
                    return false;
                if(node1.children.length !== node2.children.length)
                    return false;
                for(let i = 0; i < node1.children.length; i++)
                    if(!isSameTree(node1.children[i], node2.children[i]))
                        return false;
                return true;
            }

            const replace = (newTree, oldTree) => {
                if(isSameTree(newTree, oldTree))
                    return ;
                if(!isSameNode(newTree, oldTree))
                    newTree.mountTo(oldTree.range);
                else{
                    for(let i = 0; i < newTree.children.length; i++){
                        replace(newTree.children[i], oldTree.children[i]);
                    }
                }
            }

            replace(vdom, this.oldVdom);

        }
        else
            vdom.mountTo(this.range);
        this.oldVdom = vdom;
    }

    appendChild(vchild){
        this.children.push(vchild)
    }

    setState(state){
        const merge = (oldState, newState) => {
            for(let index in newState){
                if(typeof newState[index] === "object" && newState[index] !== null){
                    if(typeof oldState[index] !== "object")
                        if(newState[index] instanceof Array)
                            oldState[index] = [];
                        else
                            oldState[index] = {};
                    merge(oldState[index], newState[index]);
                }
                else
                    oldState[index] = newState[index];
            }
        }

        if(!this.state && state)
            this.state = {};
        merge(this.state, state);
        this.update()
    }
}

export let ToyReact = {
    createElement(type, attributes, ...children){
        let element;
        if(typeof type === "string")
            element = new ElementWrapper(type)
        else 
            element = new type;

        for(let key in attributes){
            element.setAttribute(key, attributes[key]);
        }
        
        const insertChildren = (children) => {
            for(let child of children){

                if(child === null || child === void 0)
                    child = "";
                if(typeof child === "object" && child instanceof Array)
                    insertChildren(child);
                else {
                    if( !(child instanceof Component) &&
                       !(child instanceof ElementWrapper) &&
                       !(child instanceof TextWrapper)
                     )
                        child = String(child);
                    if(typeof child === "string"){
                        child = new TextWrapper(child);
                    }
                    element.appendChild(child)
                }
            }
        }

        insertChildren(children)

        return element;
    },

    render(vdom, element){
        const range = document.createRange();
        if(element.children.length){
            range.setStartAfter(element.lastChild);
            range.setEndAfter(element.lastChild); 
        }
        else{
            range.setStart(element, 0);
            range.setEnd(element, 0);
        }
        vdom.mountTo(range);
    }
}