
export namespace AppArray.Model {
    export type Context = {
        [key: string]: string;
    }

    // That's how to extend a type :-)
    export type Environment = Context & { id: string }

    // These steps can contain platform dependent environments variables
    // and app-array expanded context {{variables}}.
    //
    // (!) Security review needed here.
    //
    // TODO: add righst per command?
    export type Command = {
        type: string;
        steps: string[];
    }

    export type CommandMap = {
        [id: string]: Command;
    }

    export type Tags = {
        // e.g. "lang"= ["c++", "java"], "src" = "https://github.com/user/repo",
        // compile time or runtime deps, documentation, URL, etc.
        // group
        [key: string]: string | string[];
    }
    export interface Element {
        id: string;
        tags?: Tags;
    }
    export type ElementMap = {
        [id: string]: Element;
    }
    export interface LiveElement extends Element {
        commands?: CommandMap;
    }

    export type BusinessObject = string;
    export enum PortKind { // Access Control?
        Read = 1 << 1,
        Write = 1 << 2,
        ReadWrite = Read | Write // CRUD? + execute? publish? subscribes?
    }
    export type PortId = string;
    export type Port = {
        id: PortId;
        object?: BusinessObject;
        kind: PortKind;
        protocol?: string;
    }

    export interface Component extends LiveElement {
        type: 'component';
        provides?: Port[];
        consumes?: PortId[];
    }
    // groups with composite pattern
    export interface Application extends LiveElement {
        type: 'application';
        provides?: Port[];
        consumes?: PortId[];
        components: Component[];
    }
}
