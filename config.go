package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/go-yaml/yaml"
	"maunium.net/go/lindeb/db"

	"github.com/gorilla/mux"
	"github.com/olivere/elastic"
)

// Config is a configuration
type Config struct {
	Database db.Config      `yaml:"database"`
	Elastic  ElasticConfig  `yaml:"elastic"`
	API      APIConfig      `yaml:"api"`
	Frontend FrontendConfig `yaml:"frontend"`
}

// ElasticConfig contains the Elasticsearch server address.
type ElasticConfig string

const elasticMapping = `
{
	"settings": {
		"number_of_shards": 1,
		"number_of_replicas": 0
	},
	"mappings": {
		"link": {
			"properties": {
				"id": {
					"type": "integer",
					"store": true
				},
				"owner": {
					"type": "integer",
					"store": true
				},
				"url": {
					"type": "text"
				},
				"domain": {
					"type": "text"
				},
				"title": {
					"type": "text"
				},
				"description": {
					"type": "text"
				},
				"html": {
					"type": "text"
				},
				"timestamp": {
					"type": "date"
				}
			}
		}
	}
}`

// Connect connects to the Elasticsearch server.
func (eConf ElasticConfig) Connect() (*elastic.Client, error) {
	client, err := elastic.NewClient()
	if err != nil {
		return nil, err
	}

	version, err := client.ElasticsearchVersion(string(eConf))
	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	exists, err := client.IndexExists("lindeb").Do(ctx)
	if err != nil {
		return client, err
	}
	if !exists {
		_, err := client.CreateIndex("lindeb").BodyString(elasticMapping).Do(ctx)
		if err != nil {
			return client, err
		}
	}

	fmt.Printf("Connected to Elasticsearch v%s.\n", version)
	return client, nil
}

// FrontendConfig contains information on how to serve static frontend files.
type FrontendConfig struct {
	Enabled  bool   `yaml:"enabled"`
	Location string `yaml:"location"`
}

// AddHandler adds the static file handler of this FrontendConfig to the given Router.
func (frontConfig FrontendConfig) AddHandler(router *mux.Router) {
	if !frontConfig.Enabled {
		return
	}
	router.
		PathPrefix("/").
		Methods(http.MethodGet).
		Handler(frontConfig.Handler())
}

// Handler generates a http.Handler that serves static files from the frontend directory.
func (frontConfig FrontendConfig) Handler() http.Handler {
	fs := http.FileServer(http.Dir(frontConfig.Location))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			r.URL.Path = "/index.html"
		}

		fs.ServeHTTP(w, r)
	})
}

// APIConfig contains information on how to host the API.
type APIConfig struct {
	Prefix  string `yaml:"prefix"`
	Address string `yaml:"address"`
	TLS     bool   `yaml:"tls"`
	TLSCert string `yaml:"tls_cert"`
	TLSKey  string `yaml:"tls_key"`
}

// ListenAndServe sets up a HTTP server according to this API configuration and sets the given
// router as the main router.
func (apiConf APIConfig) ListenAndServe(router *mux.Router) error {
	if apiConf.TLS {
		return http.ListenAndServeTLS(apiConf.Address, apiConf.TLSCert, apiConf.TLSKey, router)
	}
	return http.ListenAndServe(apiConf.Address, router)
}

// LoadConfig loads the config at the given path.
func LoadConfig(file string) (*Config, error) {
	rawConfig, err := ioutil.ReadFile(file)
	if err != nil {
		return nil, err
	}
	config := &Config{}
	err = yaml.Unmarshal(rawConfig, config)
	return config, err
}
