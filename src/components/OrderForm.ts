import {Form} from "./common/Form";
import {IOrderForm} from "../types";
import {EventEmitter, IEvents} from "./base/events";
import {ensureElement} from "../utils/utils";

export class Order extends Form<IOrderForm> {
    constructor(container: HTMLFormElement, events: IEvents) {
        super(container, events);
    }

    // works due to Object.assign thing in the render function of Form<>
    set phone(value: string) {
        (this.container.querySelector("input[name='phone']") as HTMLInputElement).value = value;
    }

    set email(value: string) {
        (this.container.querySelector("input[name='email']") as HTMLInputElement).value = value;
    }
}