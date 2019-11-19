const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const Telegram = require('telegraf/telegram')
const Emitter = require('events')


const clientDB = require('./clientdb.js'); // Юристы в orders.txt
const orderDB = require('./db.js');
const lawyerDB = require('./lawyerdb.js');

let stateClient = 0; // Параметр состояния регистрации
let stateLawyer = 0;
let stateOrder = 0;

let id =0;
let name = '';
let number = 0;
let gender = '';
let stage = 0;

let emitter = new Emitter;
let eventNameCreatedOrder = 'orderCreated';
//process.env.https_proxy="https://181.177.84.81:9622:YHKDBP:ZebtYz/4"

const bot = new Telegraf("547404020:AAHrcA2sQ2LZeqybl4pe8A7-_r0YYfdgqw4")

bot.on('polling_error', (error) => {
    console.log(error);
    bot.restart();
});
//bot.use(Telegraf.log())

console.log('Bot has been started....');
//bot.sendMessage(672537228, "Бот запущен!");
//bot.reply('Запущен',38411994);
bot.catch((err) => {
    console.log('Ooops', err)
})

/*bot.start(ctx => {
    ctx.reply('Здравствуйте, здесь бот-посредник в грузоперевозках'); //Добавить клавиатуру
})*/
bot.command('start', (ctx) => {

            ctx.reply('Кто вы?', Markup
                .keyboard([
                    ['🔍 Юрист', '😎 Клиент'], // Row1 with 2 buttons
                ])
                .oneTime()
                .resize()
                .extra()
            )
        })

bot.command('registration',ctx => {
    lawyerDB.remove({id:ctx.from.id}, {multi:true})
    clientDB.remove({id:ctx.from.id}, {multi:true})
    stateClient = 0;
    stateLawyer = 0;

    ctx.reply('Кто вы?', Markup
        .keyboard([
            ['🔍 Юрист', '😎 Клиент'], // Row1 with 2 buttons
        ])
        .oneTime()
        .resize()
        .extra()
    )

})
bot.command('menu',ctx => {                                                         //menu
    lawyerDB.find({id:ctx.from.id},function (err,docs) {

        if (JSON.stringify(docs) !== '[]') {
            ctx.reply('Меню бота:)', Extra.markup((markup) => {
                return markup.resize()
                    .keyboard([
                        ['Просмотреть доступные заказы'],
                        ['Информация'],
                        ['Зарегистрироваться заново']
                    ])

            }))
        } else {
            ctx.reply('Кто вы?', Markup
                .keyboard([
                    ['🔍 Юрист', '😎 Клиент'], // Row1 with 2 buttons
                ])
                .oneTime()
                .resize()
                .extra()
            )
        }

            })

})

bot.hears('🔍 Юрист', ( ctx ) => {
    lawyerDB.find({id:ctx.from.id},function (err,docs) {
        if (JSON.stringify(docs) === '[]') {
            ctx.reply('Добро пожаловать', Markup
                .keyboard([
                    ['🔍 Регистрация юриста'],
                    ['Информация']
                ])
                .resize()
                .extra()
            )
        } else {
            ctx.reply('Чтобы зарегистрироваться заново нажмите: /registration ' +
                'Чтобы вызвать меню нажмите /menu');
        }
})})

bot.hears('😎 Клиент', (ctx) => {
    clientDB.find({id:ctx.from.id},function (err,docs) {
        if (JSON.stringify(docs) === '[]') {
    ctx.reply('Добро пожаловать', Markup
        .keyboard([
            ['🔍 Создать задание для юриста'],
            ['Информация']
        ])
        .oneTime()
        .resize()
        .extra()
    )} else {
            ctx.reply('Чтобы зарегистрироваться заново нажмите /registration:)', Extra.markup((markup) => {
                return markup.resize()
                    .keyboard([
                        ['Информация'],
                        ['Зарегистрироваться заново'],
                        ['Удалить заказ']
                    ])

            }))
        }
})})

bot.hears('🔍 Регистрация юриста', (ctx) => {
    if(lawyerDB.findOne({id:ctx.from.id})){
        lawyerDB.remove({id: ctx.from.id}, {multi: true});
    }
    stateLawyer = 1;
    id = ctx.from.id;   // Записали ID
    //console.log(stateLawyer);
    return ctx.reply('Сначала нам нужен ваш номер телефона :)', Extra.markup((markup) => {
        return markup.resize()
            .keyboard([
                markup.contactRequestButton('Отправить свой номер')
            ]).oneTime()
    }))

})
bot.on('contact', ctx => {                                          //Заказ размещен
    if (stateLawyer === 1){ // Не зареган
        number = ctx.message.contact.phone_number;
        name = ctx.from.first_name;
        //console.log(ctx.message.contact.phone_number);
        ctx.reply('Отлично! Из какого вы города?')
        stateLawyer = 2;
    } else if (stateClient === 3){
        clientDB.update({id:ctx.from.id}, {$push:{number:ctx.message.contact.phone_number}}); // Добавить событие

        ctx.reply('Спасибо за вашу заявку, юрист свяжется с вами в ближайшее время', Extra.markup((markup) => {
            return markup.resize()
                .keyboard([
                    ['Информация'],
                    ['Зарегистрироваться заново'],
                    ['Удалить заказ']
                ])

    }))
        emitter.emit(eventNameCreatedOrder, ctx.from.id);
    } else{
        ctx.reply('Какая-то ошибка');
    }
    /*ctx.reply(stateLawyer + "," + stateClient + "," + stateOrder);
    console.log('Состояния юриста, клиента и заказа: ' + stateLawyer + "," + stateClient + "," + stateOrder);*/
})

bot.hears('🔍 Создать задание для юриста', (ctx) => {

     ctx.reply('Что именно вы хотите заказать', Markup

            .keyboard([
                ['Документы'],
                ['Консультация'],
                ['Другое'],
                ['Закрыть']
            ]).oneTime()
            .resize()
            .extra())
});

bot.hears(['Документы' ,'Консультация' , 'Другое'],(ctx) =>{
    clientDB.insert({id:ctx.from.id, type:ctx.message.text});
    ctx.reply('Кратко опишите проблему для юриста');
    stateClient = 1;
})
bot.hears('Зарегистрироваться заново', ctx => ctx.reply('Чтобы зарегистрироваться заново нажмите: /registration ' +
    'Чтобы вызвать меню нажмите /menu'))

bot.on('message', ctx => {
    let city = ''
     if (stateLawyer === 2) { // Не зареган
        ctx.reply('Ваш пол', Extra.markup((markup) => {
            return markup.resize()
                .keyboard([
                    ['Мужской'],
                    ['Женский']
                ])

        }))
         city = ctx.message.text;
            //lawyerDB.update({id: id, number: number, name: name, city: ctx.message.text}); // Сделать вывод клавиатуры
        stateLawyer = 3; // All ok

    }if (stateLawyer === 3 && (ctx.message.text ==='Мужской'||ctx.message.text ==='Женский')) { // Не зареган
        ctx.reply('Какой у вас стаж работы (лет)').then(()=>{
            stateLawyer = 4; // All ok
            gender = ctx.message.text;
        })

        //lawyerDB.update({id: id, number: number, name: name, city: ctx.message.text}); // Сделать вывод клавиатуры


    }
     if (stateLawyer === 4) { // Не зареган
        ctx.reply('Вы зарегистрированы :)', Extra.markup((markup) => {
            return markup.resize()
                .keyboard([
                    ['Просмотреть доступные заказы'],
                    ['Информация'],
                    ['Зарегистрироваться заново']
                ])

        }))
        lawyerDB.insert({id: id, number: number, name: name, gender: gender, city:city, stage:ctx.message.text}); // Сделать вывод клавиатуры
        stateLawyer = 6; // All ok

    }else if (stateClient === 1) {
        clientDB.update({id: ctx.from.id}, {$push: {trouble: ctx.message.text}})
        ctx.reply('Отлично, из какого вы города?')
        stateClient = 2;

    } else if (stateClient === 2) {
        clientDB.update({id: ctx.from.id}, {$push: {city: ctx.message.text}})
        ctx.reply('Отлично, осталось лишь взять ваш номер телефона :)', Extra.markup((markup) => {
            return markup.resize()
                .keyboard([
                    markup.contactRequestButton('Отослать свой номер')
                ])
        }))
        stateClient = 3;
    } else if (ctx.message.text === 'Информация') {
        ctx.reply('Тут информация!')
    } else if (ctx.message.text === 'Закрыть') {
        ctx.reply('Добро пожаловать', Markup
            .keyboard([
                ['🔍 Создать задание для юриста'],
                ['Информация']
            ])
            .oneTime()
            .resize()
            .extra()
        )
    } else if (ctx.message.text === 'Удалить заказ') {
        clientDB.remove({id: ctx.from.id}, {multi: true})
        ctx.reply('Ваш заказ удален', Markup
            .keyboard([
                ['🔍 Создать задание для юриста'],
                ['Информация']
            ])
            .oneTime()
            .resize()
            .extra()
        )

    }else if (ctx.message.text === 'Просмотреть доступные заказы') {
        clientDB.find({},function (err,orders) {

            let arrayOfOrders = orders;
            if(JSON.stringify(orders) === '[]') {
                ctx.reply('Доступных заказов пока нет');
                return
            }
            let tmp = 0;
            ctx.replyWithHTML(`<b>Доступные заказы:</b>`).then(()=>{
                arrayOfOrders.forEach(element => {
                    tmp++;
                    console.log(element)
                    //ctx.replyWithHTML(``).then(()=>{ // Боже, что за пиздец
                        ctx.replyWithHTML(`<b>Заказ №${tmp}</b>
Тема: ${element.type}
Описание: ${element.trouble}
Город: ${element.city}`,Markup.inlineKeyboard([
                            Markup.callbackButton('Взять этот заказ', element.id)
                        ]).extra())

                })
            })

        })
    }
})

    emitter.on(eventNameCreatedOrder, function (data) {                                 //Обработка события создания заказа
        //console.log(data)
        clientDB.findOne({id: data},function (err,orders) {
            //console.log(orders);
            //bot.telegram.sendMessage('384119946', orders)
            lawyerDB.find({}, function (err,lawyers) {
                let arrayOfLawyers = lawyers
                let tmp2 = 0;
                if(JSON.stringify(arrayOfLawyers) === '[]') {
                    console.log('На новый заказ пока нет юристов')
                    return
                } else{
                        arrayOfLawyers.forEach(element => {
                            tmp2++;
                            console.log(element)
                            //ctx.replyWithHTML(``).then(()=>{ // Боже, что за пиздец
                            bot.telegram.sendMessage(element.id,`<b>Доступен новый заказ:</b>`,{parse_mode:'HTML'}).then(()=>{
                                bot.telegram.sendMessage(element.id,`Тема: ${orders.type}
Описание: ${orders.trouble}
Город: ${orders.city}`,{
                                    reply_markup: {
                                        inline_keyboard: [[
                                            {
                                                text: `Взять этот заказ`,
                                                callback_data: orders.id
                                            }
                                        ]]
                                    }
                                    ,parse_mode:'HTML'})

                        })
                    })
                }
            })
        })
    })



    bot.use((ctx) => {                                                                             //Обработка взятия заказа
        console.log(ctx.message);
        if(ctx.update.callback_query.id){

                clientDB.findOne({id:parseInt(ctx.update.callback_query.data)}, function (err,data3) {
                    let order = data3
                    console.log(order)
                    if(order===null){
                        ctx.reply('Какая-то ошибка')
                    } else {
                        //console.log(data3)
                        ctx.reply('Этот заказ ваш. Свяжитесь с клиентом лично.').then(()=>{
                            ctx.telegram.sendContact(ctx.from.id,data3.number,'Клиент')
                            lawyerDB.findOne({id:parseInt(ctx.from.id)}, function (err,data4){
                                ctx.replyWithHTML(`<b>Ваш юрист</b>
Имя: ${data4.name}
Город: ${data4.city}
Пол: ${data4.gender}
Стаж: ${data4.stage}`)
                                ctx.telegram.sendContact(data3.id,data4.number,'Ваш юрист')
                            })
                        })

//
                    }
                })
                clientDB.remove({id:parseInt(ctx.update.callback_query.data)}, {multi:true});



        }


    });



    bot.launch()
