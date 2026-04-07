package com.wavemaker.when_to_work.getPreferenceRange.service;


import com.wavemaker.when_to_work.getPreferenceRange.model.*;
import com.wavemaker.when_to_work.getPreferenceRange.model.ResponseRootResponseROOTEntryItem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface GetPreferenceRangeService {

  /**
   * 
   * 
    * @param ngrok_skip_browser_warning ngrok-skip-browser-warning (optional)
    * @param companyId companyId (optional)
    * @param endDate endDate (optional)
    * @param employeeId employeeId (optional)
    * @param startDate startDate (optional)
   * @return List&lt;ResponseRootResponseROOTEntryItem&gt;
   */
  @RequestLine("GET /preferences/day/range?companyId={companyId}&endDate={endDate}&employeeId={employeeId}&startDate={startDate}")
  @Headers({
    "Accept: application/json",
    "ngrok-skip-browser-warning: {ngrok_skip_browser_warning}"  })
  List<ResponseRootResponseROOTEntryItem> invoke(@Param("ngrok_skip_browser_warning") String ngrok_skip_browser_warning, @Param("companyId") String companyId, @Param("endDate") String endDate, @Param("employeeId") String employeeId, @Param("startDate") String startDate);


    /**
     * 
     * 
     * Note, this is equivalent to the other <code>invoke</code> method,
     * but with the query parameters collected into a single Map parameter. This
     * is convenient for services with optional query parameters, especially when
     * used with the {@link InvokeQueryParams} class that allows for
     * building up this map in a fluent style.
     * @param ngrok_skip_browser_warning ngrok-skip-browser-warning (optional)
     * @param queryParams Map of query parameters as name-value pairs
     *   <p>The following elements may be specified in the query map:</p>
     *   <ul>
     *   <li>companyId - companyId (optional)</li>
     *   <li>endDate - endDate (optional)</li>
     *   <li>employeeId - employeeId (optional)</li>
     *   <li>startDate - startDate (optional)</li>
     *   </ul>
     * @return List&lt;ResponseRootResponseROOTEntryItem&gt;
     */
    @RequestLine("GET /preferences/day/range?companyId={companyId}&endDate={endDate}&employeeId={employeeId}&startDate={startDate}")
    @Headers({
    "Accept: application/json",
        "ngrok-skip-browser-warning: {ngrok_skip_browser_warning}"    })
    List<ResponseRootResponseROOTEntryItem> invoke
    (@Param("ngrok_skip_browser_warning") String ngrok_skip_browser_warning, @QueryMap(encoded=true)
    MultiValueMap<String, String> queryParams);

}
