package lindeb

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"github.com/gorilla/mux"
	"github.com/go-sql-driver/mysql"
	"database/sql"
	"github.com/olivere/elastic"
	elasticconfig "github.com/olivere/elastic/config"
)

// Config is a configuration
type Config struct {
	Database DatabaseConfig `yaml:"database"`
	Elastic  ElasticConfig  `yaml:"elastic"`
	API      APIConfig      `yaml:"api"`
}

type DatabaseConfig string

func (dbConf DatabaseConfig) Connect() (*sql.DB, error) {
	conf, err := mysql.ParseDSN(string(dbConf))
	if err != nil {
		return nil, err
	}
	return sql.Open("mysql", conf.FormatDSN())
}

type ElasticConfig string

func (eConf ElasticConfig) Connect() (*elastic.Client, error) {
	conf, err := Parse(string(eConf))
	if err != nil {
		return nil, err
	}
	return elastic.NewClientFromConfig(conf)
}

type APIConfig struct {
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
