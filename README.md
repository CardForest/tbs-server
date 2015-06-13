> Turn-based strategy server.

** WORK IN PROGRESS - DONT'T WASTE YOUR TIME IN THIS **

### componenets

#### security

- [x] hide implementation detail: remove `x-powered-by` header
- [x] disallows emeding in iframe: set `X-Frame-Options: SAMEORIGIN`
- [x] read to correct ip: `app.set('trust proxy', 'loopback')` (assumes we behind reverse proxy, as is the case with heroku)
- [x] redirect to https if `x-forwarded-proto: http` (again, assumes we behind reverse proxy, as is the case with heroku)

#### logging

- [x] setup default winston log
- [x] setup morgan to relay to winston info stream

#### robots

- [x] disallow in development
- [x] disallow static bower folder in production

#### errors

- [x] forward not found error the error handler
- [x] use devlopment [error handler](https://github.com/expressjs/errorhandler)

## License

AGPL © [Amit Portnoy](https://github.com/amitport)

