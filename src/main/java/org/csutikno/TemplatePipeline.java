package org.csutikno;

import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.TextIO;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.ValueProvider;
import org.apache.beam.sdk.options.Validation;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

import static org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.CreateDisposition.CREATE_IF_NEEDED;
import static org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.WriteDisposition.WRITE_APPEND;

/**
 * Do some randomness
 */
public class TemplatePipeline {

    public static void main(String[] args) {
        PipelineOptionsFactory.register(TemplateOptions.class);
        TemplateOptions options = PipelineOptionsFactory.fromArgs(args).withValidation().as(TemplateOptions.class);
        Pipeline pipeline = Pipeline.create(options);
        pipeline.apply("READ", TextIO.read().from(options.getInputFile()))
                .apply("TRANSFORM", ParDo.of(new WikiParDo()))
                .apply("WRITE", BigQueryIO.writeTableRows()
                        .to(String.format("%s:raw.transaction", options.getProject()))
                        .withCreateDisposition(CREATE_IF_NEEDED)
                        .withWriteDisposition(WRITE_APPEND)
                        .withSchema(getTableSchema()));
        pipeline.run();
    }

    private static TableSchema getTableSchema() {
        List<TableFieldSchema> fields = new ArrayList<>();
        fields.add(new TableFieldSchema().setName("Date").setType("STRING").setMode("REQUIRED"));
        fields.add(new TableFieldSchema().setName("Transaction Details").setType("STRING").setMode("REQUIRED"));
        fields.add(new TableFieldSchema().setName("Category").setType("STRING"));
        fields.add(new TableFieldSchema().setName("Account").setType("STRING"));
        fields.add(new TableFieldSchema().setName("Account Number").setType("STRING"));
        fields.add(new TableFieldSchema().setName("Amount").setType("STRING").setMode("REQUIRED"));
        return new TableSchema().setFields(fields);
    }

    public interface TemplateOptions extends DataflowPipelineOptions {
        @Description("GCS path of the file to read from")
        ValueProvider<String> getInputFile();

        void setInputFile(ValueProvider<String> value);
    }

    public static class WikiParDo extends DoFn<String, TableRow> {
        public static final String HEADER = "Date,Transaction Details,Category,Account,Account Number,Amount";

        @ProcessElement 
        public void processElement(ProcessContext c) throws Exception {
            if (c.element().equalsIgnoreCase(HEADER)) return;
            String[] split = c.element().split(",");
            if (split.length > 6) return;
            TableRow row = new TableRow();
            for (int i = 0; i < split.length; i++) {
                TableFieldSchema col = getTableSchema().getFields().get(i);
                row.set(col.getName(), split[i]);
            }
            c.output(row);
        }
    }
}
