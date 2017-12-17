package lindeb

import (
	"context"
	"database/sql"
	"net/http"
	"os"

	"fmt"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"github.com/olivere/elastic"
	flag "maunium.net/go/mauflag"
)

var configPath = flag.MakeFull("c", "config", "Path to the config file.", "config.yaml").String()
var wantHelp, _ = flag.MakeHelpFlag()

type AppContext struct {
	Config  *Config
	DB      *sql.DB
	Elastic *elastic.Client
	Context context.Context
}

func (ctx AppContext) HTTPMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r.WithContext(ctx.Context))
	})
}

func main() {
	err := flag.Parse()
	if err != nil {
		fmt.Println(err)
		*wantHelp = true
	}
	if *wantHelp {
		flag.PrintHelp()
		os.Exit(1)
	}

	config, err := LoadConfig(*configPath)
	if err != nil {
		fmt.Println("Failed to load config:", err)
		os.Exit(10)
	}

	db, err := config.Database.Connect()
	if err != nil {
		fmt.Println("Database connection failed:", err)
		os.Exit(11)
	}
	db.CreateTables()

	search, err := config.Elastic.Connect()
	if err != nil {
		fmt.Println("Elasticsearch connection failed:", err)
		os.Exit(12)
	}

	appCtx := AppContext{
		Config:  config,
		DB:      db,
		Elastic: search,
	}
	realCtx := context.WithValue(context.Background(), "app", appCtx)
	appCtx.Context = realCtx

	r := mux.NewRouter()

	api := r.PathPrefix(config.API.Prefix).Subrouter()
	// TODO add listen paths

	config.Frontend.AddHandler(r)

	err = config.API.ListenAndServe(r)
	if err != nil {
		fmt.Println("HTTP server quit unexpectedly:", err)
		os.Exit(20)
	}
}
