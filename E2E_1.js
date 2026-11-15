import { check, sleep } from 'k6';
import http from 'k6/http'
import { group } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = "https://quickpizza.grafana.com";
let USERNAME;
const PASSWORD = String(Math.random() * 1000000);
const successfulOrders = new Counter('successful_orders');

export const options = {
    stages: [
        { duration: '5s', target: 2 },
        { duration: '5s', target: 4 },
        { duration: '3s', target: 0 }
    ],

    thresholds: {
        "checks": ['rate>0.99'],
        'http_req_duration': ['p(95)< 350'],
        'iteration_duration': ['p(95)<8000'],
        'successful_orders': ['count>=2']

    }
}


export default function () {
    let user_registered;

    const headers = {
        "Content-Type": "application/json",
    }

    const body = {
        "username": createRandomUsername(),
        "password": PASSWORD
    }

    function createRandomUsername() {
        USERNAME = "soumalyadas";
        let alphabets = "abcdefghijklmnopqrstuvwxyz";

        for (let i = 0; i < 10; i++) {
            USERNAME += alphabets[Math.floor(Math.random() * 5)];
        }
        return USERNAME;
    }


    group("User Registration", () => {



        const res = http.post(`${BASE_URL}/api/users`, JSON.stringify(body), headers);

        user_registered = check(res, {
            "registration successful": (r) => {
                return r.status === 201
            }
        })

        if (!user_registered) {
            console.error("Registration failed", res.status, res.body);
        }

        sleep(1);
    })
    let token;
    let ifUserAuthenticated;
    let orderCreated;
    let orderId;
    group("User Login", () => {
        const res = http.post(`${BASE_URL}/api/users/token/login`, JSON.stringify(body), headers);
        ifUserAuthenticated = check(res, {
            "login successful": (r) => {
                return r.status === 200
            },
            "is Token present ": (r) => {
                return r.json('token') !== undefined
            }
            // ,
            // "Token is of type String": (r) => {
            //     return r.json('token').length() > 5
            // }


        })
        sleep(1);
        if (ifUserAuthenticated) {
            console.log("Authentication Successfully", USERNAME, res.status, res.body);
            token = res.json('token');
        } else {
            console.error("Authentication Failed", USERNAME, res.status, res.body);
        }

    })

    group("order Management", () => {
        const orderPayload = {
            maxCaloriesPerSlice: 1000,
            mustBeVegetarian: false,
            excludedIngredients: ["anchovies"],
            excludedTools: [],
            maxNumberOfToppings: 4,
            minNumberOfToppings: 2,
            customName: 'My Custom Pizza'
        };

        const params = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        };

        let orderResp = http.post(
            `${BASE_URL}/api/pizza`,
            JSON.stringify(orderPayload),
            params
        );

        orderCreated = check(orderResp, {
            "pizza generated successfully": (r) => r.status === 200,
            "pizza has order id": (r) => r.json("pizza.id") !== undefined,
            "pizza has name": (r) => r.json("pizza.name") !== undefined,
            "pizza has custom name": (r) => r.json("pizza.name") === 'My Custom Pizza'

        });

        sleep(1);

        if (orderCreated) {
            console.log("Order Created Successfully", orderResp.status, orderResp.body);
            orderId = orderResp.json("pizza.id");
            console.log("Order Id is", orderId);
            successfulOrders.add(1);
        } else {
            console.error("Order Creation Failed", orderResp.status, orderResp.body);
        }

        //Retrieve order

        const orderRetrv = http.get(
            `${BASE_URL}/api/pizza/` + orderId,
            params
        );

        const orderRetrieved = check(orderRetrv, {
            "pizza generated successfully": (r) => r.status === 200,
            "pizza has order id": (r) => r.json("id") == orderId
        });

        sleep(1);

        if (orderRetrieved) {
            console.log("Order Retrieved Successfully", orderRetrieved.status, orderRetrieved.body);
        } else {
            console.error("Order Retrieved Failed", orderResp.status, orderResp.body);
        }

    });


}