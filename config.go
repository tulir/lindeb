package lindeb

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

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

type ElasticConfig string

func (eConf ElasticConfig) Connect() (*elastic.Client, error) {
	conf, err := Parse(string(eConf))
	if err != nil {
		return nil, err
	}
	return elastic.NewClientFromConfig(conf)
}

type FrontendConfig struct {
	Enabled  bool   `yaml:"enabled"`
	Location string `yaml:"location"`
}

func (frontConfig FrontendConfig) AddHandler(router *mux.Router) {
	if !frontConfig.Enabled {
		return
	}
	router.
		PathPrefix("/").
		Methods(http.MethodGet).
		Handler(frontConfig.Handler())
}

func (frontConfig FrontendConfig) Handler() http.Handler {
	fs := http.FileServer(http.Dir(frontConfig.Location))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			r.URL.Path = "/index.html"
		}

		fs.ServeHTTP(w, r)
	})
}

type APIConfig struct {
	Prefix  string `yaml:"prefix"`
	Address string `yaml:"address"`
	TLS     bool   `yaml:"tls"`
	TLSCert string `yaml:"tls_cert"`
	TLSKey  string `yaml:"tls_key"`
}

func (apiConf APIConfig) ListenAndServe(router *mux.Router) error {
	if apiConf.TLS {
		return http.ListenAndServeTLS(apiConf.Address, apiConf.TLSCert, apiConf.TLSKey, router)
	} else {
		return http.ListenAndServe(apiConf.Address, router)
	}
}

func LoadConfig(file string) (*Config, error) {
	rawConfig, err := ioutil.ReadFile(file)
	if err != nil {
		return nil, err
	}
	config := &Config{}
	err = json.Unmarshal(rawConfig, config)
	return config, err
}
