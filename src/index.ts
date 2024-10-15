import './scss/styles.scss';

import {AuctionAPI} from "./components/AuctionAPI";
import {API_URL, CDN_URL} from "./utils/constants";
import {EventEmitter} from "./components/base/events";
import { cloneTemplate, createElement, ensureElement } from './utils/utils';
import { LotModel, UserStatus } from './components/Model';
import { PageLayout } from './components/view/PageLayout';
import { Modal } from './components/common/Modal';
import { Basket } from './components/common/Basket';
import { Tabs } from './components/view/NavigationTabs';
import { Order } from './components/OrderForm';
import { AuctionItem, BidItem, CatalogItem } from './components/view/AuctionCards';
import { OrderFinish } from './components/view/OrderFinish';
import { IOrderForm } from './types';

const events = new EventEmitter();
const api = new AuctionAPI(CDN_URL, API_URL);

// Чтобы мониторить все события, для отладки
events.onAll(({ eventName, data }) => {
    console.log(eventName, data);
})

// Все шаблоны
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#preview');
const auctionTemplate = ensureElement<HTMLTemplateElement>('#auction');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#bid');
const bidsTemplate = ensureElement<HTMLTemplateElement>('#bids');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const tabsTemplate = ensureElement<HTMLTemplateElement>('#tabs');
const soldTemplate = ensureElement<HTMLTemplateElement>('#sold');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

// Модель данных приложения
const userStatus = new UserStatus({}, events);
// LotModel is private for each lot when they are loaded

// Глобальные контейнеры
const page = new PageLayout(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);

// Переиспользуемые части интерфейса
const bids = new Basket(cloneTemplate(bidsTemplate), events);
const basket = new Basket(cloneTemplate(basketTemplate), events);
const tabs = new Tabs(cloneTemplate(tabsTemplate), { 
    onClick: (name) => events.emit(name === 'closed' ? 'basket:open' : 'bids:open')
});
const order = new Order(cloneTemplate(orderTemplate), events);

// Дальше идет бизнес-логика
// Поймали событие, сделали что нужно

// Изменились элементы каталога
events.on('items:changed', () => {
    page.catalog.items = userStatus.lots.map(item => {
        const card = new CatalogItem(cloneTemplate(cardCatalogTemplate), () => events.emit('card:select', item));
        return card.render({
            title: item.title,
            image: item.image,
            description: [item.about],
            status: {
                statusName: item.status,
                label: item.timeStatusText()
            },
        });
    });

    page.counter = userStatus.getLotsByStatus('closed', null, true).length;
});

// Отправлена форма заказа
events.on('order:submit', () => {
    api.orderLots(userStatus.order)
        .then((result) => {
            const totalBought = userStatus.getTotal();
            const finishWindow = new OrderFinish(cloneTemplate(successTemplate), () => {
                modal.close();
                userStatus.clearBasket();
                events.emit('auction:changed');
            });

            modal.render({ content: finishWindow.render({total: totalBought}) });
        })
});

// Изменилось состояние валидации формы
events.on('formErrors:change', (errors: Partial<IOrderForm>) => {
    order.valid = (errors.email === undefined && errors.phone === undefined);
    order.errors = Object.values(errors).filter(i => i !== undefined).join('\n');
});

// Изменилось одно из полей
events.on(/^order\..*:change/, (data: { field: keyof IOrderForm, value: string }) => {
    userStatus.setOrderField(data.field, data.value);
});

// Открыть форму заказа
events.on('order:open', () => {
    modal.render({
        // clears filled values into oblivion
        content: order.render({
            phone: '',
            email: '',
            valid: false,
            errors: ''
        })
    });
});

// Открыть активные лоты
events.on('bids:open', () => {
    modal.render({
        content: createElement<HTMLElement>('div', {}, [
            tabs.render({
                selected: 'active'
            }),
            bids.render()
        ])
    });
});

// Открыть закрытые лоты
events.on('basket:open', () => {
    modal.render({
        content: createElement<HTMLElement>('div', {}, [
            tabs.render({
                selected: 'closed'
            }),
            basket.render()
        ])
    });
});

// Изменения в лоте, но лучше все пересчитать
events.on('auction:changed', () => {
    const closedLots = userStatus.getLotsByStatus('closed', undefined, true);
    const activeBidLots = userStatus.getLotsByStatus('active', true);

    page.counter = closedLots.length;
    bids.items = activeBidLots.map(item => {
        const card = new BidItem(cloneTemplate(cardBasketTemplate), () => events.emit('preview:changed', item));
        return card.render({
            title: item.title,
            image: item.image,
            status: {
                amount: item.price,
                status: item.userLeads()
            }
        });

    });

    basket.items = closedLots.map(item => {
        const card = new BidItem(cloneTemplate(soldTemplate), (event) => {
            const checkbox = event.target as HTMLInputElement;
            userStatus.changeOrderStatus(item.id, checkbox.checked);
            basket.total = userStatus.getTotal();
            basket.selected = userStatus.order.items;
        });
        return card.render({
            title: item.title,
            image: item.image,
            status: {
                amount: item.price,
                status: true
            }
        });
    });
    basket.selected = userStatus.order.items;
    basket.total = userStatus.getTotal();
})

// Открыть лот
events.on('card:select', (item: LotModel) => {
    userStatus.setPreview(item);    
});

// Изменен открытый выбранный лот
events.on('preview:changed', (item: LotModel) => {
    // function for showing LotModel on modal
    const showItem = (item: LotModel) => {
        // create view
        const auctionCardTemplate = cloneTemplate(cardPreviewTemplate);
        auctionCardTemplate.querySelector('.lot__status').replaceWith(cloneTemplate(auctionTemplate));
        const card = new AuctionItem(auctionCardTemplate, undefined, (price) => {
            item.placeBid(price);
            card.render({
                status: {
                    statusName: item.status,
                    time: item.timeStatusText(),
                    label: item.auctionStatusText(),
                    nextBid: item.bidMinimum(),
                    history: item.history
                }
            });
        });

        // make modal render view
        modal.render({
            content: card.render({
                title: item.title,
                image: item.image,
                description: item.description.split("\n"),
                status: {
                    statusName: item.status,
                    time: item.timeStatusText(),
                    label: item.auctionStatusText(),
                    nextBid: item.bidMinimum(),
                    history: item.history
                }
            })
        });
    };

    if (item) {
        api.getLotItem(item.id)
            .then((result) => {
                item.description = result.description;
                item.history = result.history;
                showItem(item);
            })
            .catch((err) => {
                console.error(err);
            })
    } else {
        modal.close();
    }
});


// Блокируем прокрутку страницы если открыта модалка
events.on('modal:open', () => {
    page.locked = true;
});

// ... и разблокируем
events.on('modal:close', () => {
    page.locked = false;
});

// Получаем лоты с сервера
api.getLotList()
    .then(result => {
        // вместо лога поместите данные в модель
        console.log(result);
    })
    .catch(err => {
        console.error(err);
    });
