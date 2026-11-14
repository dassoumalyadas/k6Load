import { check, sleep } from 'k6';
import http from 'k6/http'
import { group } from 'k6';

const BASE_URL = "https://quickpizza.grafana.com";
let USERNAME = "soumalyadas";
const PASSWORD = String(Math.random() * 1000000);

export const options = {
    vus: 1,
    duration: "3s",
    thresholds: {
        "checks": ['rate>0.99'],
        'http_req_duration': ['p(95)< 300'],

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

        let alphabets = "abcdefghijklmnopqrstuvwxyz";

        for (let i = 0; i < 10; i++) {
            USERNAME += alphabets[Math.floor(Math.random() * 26)];
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
    group("User Login", () => {
        const res = http.post(`${BASE_URL}/api/users/token/login`, JSON.stringify(body), headers);
        ifUserAuthenticated = check(res, {
            "login successful": (r) => {
                return r.status === 200
            },
            "is Token present ": (r) => {
                return r.json('token') !== undefined
            },
            "Token is of type String": (r) => {
                return r.json('token').length > 5
            }


        })
        sleep(1);
        if (ifUserAuthenticated) {
            console.log("Authentication Successfully", res.status, res.body);
            token = res.json('token');
        } else {
            console.error("Authentication Failed", res.status, res.body);
        }

    })
}